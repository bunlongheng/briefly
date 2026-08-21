// Surgical audio edits on an existing book WITHOUT re-synthesizing (no
// ElevenLabs credits). Cuts a phrase or a time range out of the MP3 and shifts
// the karaoke alignment to match, so highlighting stays in sync. Backs up the
// original mp3+json to data/audio-edit-backup/ first.
//
// Usage: tsx scripts/audio-edit.ts <id> remove "<phrase>" [occurrence=1]
//        tsx scripts/audio-edit.ts <id> cut <fromSec> <toSec>
import { copyFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import db, { audioPath, alignPath } from "@/lib/db";
import { writeManifest } from "@/lib/manifest";

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const [, , idArg, verb, a1, a2] = process.argv;
const id = Number(idArg);
if (!id || !["remove", "cut"].includes(verb)) {
  console.error('usage: tsx scripts/audio-edit.ts <id> remove "<phrase>" [n] | <id> cut <from> <to>');
  process.exit(1);
}

type Align = { v: number; duration: number; text: string; starts: number[]; ends: number[] };
const align: Align = JSON.parse(readFileSync(alignPath(id), "utf8"));

// resolve the char span [i0, i1) to delete
let i0 = -1, i1 = -1;
if (verb === "remove") {
  const phrase = (a1 || "").toLowerCase();
  if (!phrase) { console.error("empty phrase"); process.exit(1); }
  const hay = align.text.toLowerCase();
  let from = 0;
  for (let n = Number(a2) || 1; n > 0; n--) {
    i0 = hay.indexOf(phrase, from);
    if (i0 < 0) { console.error(`occurrence not found: "${a1}"`); process.exit(1); }
    from = i0 + 1;
  }
  i1 = i0 + phrase.length;
  // swallow one adjacent space so we don't leave a double gap in the text
  if (align.text[i1] === " ") i1++;
  else if (align.text[i0 - 1] === " ") i0--;
} else {
  const t0 = Number(a1), t1 = Number(a2);
  if (!(t1 > t0) || t0 < 0) { console.error("bad range"); process.exit(1); }
  i0 = align.starts.findIndex((s) => s >= t0);
  i1 = align.ends.findIndex((e) => e > t1);
  if (i1 < 0) i1 = align.ends.length;
  if (i0 < 0 || i0 >= i1) { console.error("range covers no characters"); process.exit(1); }
}

const t0 = align.starts[i0];
const t1 = Math.min(align.ends[i1 - 1], align.starts[i1] ?? align.duration);
const delta = t1 - t0;
console.log(`#${id} ${verb}: chars [${i0},${i1}) "${align.text.slice(i0, i1)}" -> cutting ${t0.toFixed(2)}s-${t1.toFixed(2)}s (${delta.toFixed(2)}s)`);

// backup, then cut the mp3 (2 trims + concat, re-encoded at the pipeline's 192k)
const backupDir = join(process.cwd(), "data", "audio-edit-backup");
mkdirSync(backupDir, { recursive: true });
copyFileSync(audioPath(id), join(backupDir, `${id}-${Date.now()}.mp3`));
copyFileSync(alignPath(id), join(backupDir, `${id}-${Date.now()}.json`));

const tmp = audioPath(id).replace(/\.mp3$/, ".edit.mp3");
const filter =
  `[0:a]atrim=0:${t0.toFixed(3)},asetpts=PTS-STARTPTS[a];` +
  `[0:a]atrim=${t1.toFixed(3)},asetpts=PTS-STARTPTS[b];` +
  `[a][b]concat=n=2:v=0:a=1[out]`;
const res = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-i", audioPath(id),
  "-filter_complex", filter, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", tmp]);
if (res.status !== 0) { console.error(res.stderr?.toString() || "ffmpeg failed"); process.exit(1); }
renameSync(tmp, audioPath(id));

// splice the alignment: drop the span, shift everything after it left by delta
const round = (n: number) => Math.round(n * 1000) / 1000;
const keep = (i: number) => i < i0 || i >= i1;
const shift = (t: number, i: number) => (i >= i1 ? t - delta : t);
const next: Align = {
  v: align.v,
  duration: round(align.duration - delta),
  text: align.text.slice(0, i0) + align.text.slice(i1),
  starts: align.starts.map(shift).filter((_, i) => keep(i)).map(round),
  ends: align.ends.map(shift).filter((_, i) => keep(i)).map(round),
};
writeFileSync(alignPath(id), JSON.stringify(next));

db.prepare("UPDATE books SET duration_sec=? WHERE id=?").run(Math.round(next.duration), id);
writeManifest();
console.log(`done: ${round(align.duration)}s -> ${next.duration}s. Backup in data/audio-edit-backup/`);
