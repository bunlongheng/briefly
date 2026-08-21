// Re-narrate an existing book IN PLACE with the current pipeline (voice model +
// settings from lib/elevenlabs, plus the ambient bed from lib/mix). Keeps the
// book's id, so its cover and deep links stay valid. Run after changing the
// narration pipeline, then commit public/audio/<id>.* + public/books.json.
//
// Usage: tsx scripts/renarrate.ts <id> [voiceId]   (voiceId optional; keeps the
// book's current voice if omitted)
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Standalone scripts don't get Next's .env.local autoload - do it ourselves so
// ELEVENLABS_API_KEY is available (never hardcode the key).
if (!process.env.ELEVENLABS_API_KEY) {
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local - rely on the ambient environment */
  }
}

import db, { audioPath, alignPath, type BookRow } from "@/lib/db";
import { synthesizeBook } from "@/lib/elevenlabs";
import { mixWithBed } from "@/lib/mix";
import { voiceName } from "@/lib/voices";
import { writeManifest } from "@/lib/manifest";

const id = Number(process.argv[2]);
const voiceOverride = process.argv[3];
if (!id) {
  console.error("usage: tsx scripts/renarrate.ts <id> [voiceId]");
  process.exit(1);
}

const row = db.prepare("SELECT * FROM books WHERE id=?").get(id) as BookRow | undefined;
if (!row) {
  console.error(`no book with id ${id}`);
  process.exit(1);
}
const voiceId = voiceOverride || row.voice_id || "";

async function run() {
  console.log(`re-narrating #${id} "${row!.title}" in ${voiceName(voiceId)} ...`);
  const { audio, alignment, duration } = await synthesizeBook(row!.body, voiceId);
  writeFileSync(audioPath(id), audio);
  const mixed = await mixWithBed(audioPath(id), duration);

  const round = (n: number) => Math.round(n * 1000) / 1000;
  writeFileSync(
    alignPath(id),
    JSON.stringify({
      v: 1,
      duration: round(duration),
      text: alignment.chars.join(""),
      starts: alignment.starts.map(round),
      ends: alignment.ends.map(round),
    }),
  );
  db.prepare(
    "UPDATE books SET has_audio=1, duration_sec=?, voice_id=?, voice_name=?, music=1 WHERE id=?",
  ).run(Math.round(duration), voiceId, voiceName(voiceId), id);
  writeManifest();
  console.log(`done: ${Math.round(duration)}s, bed ${mixed ? "mixed" : "skipped (no ffmpeg?)"}`);
}

run().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
