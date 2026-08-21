import { NextRequest, NextResponse } from "next/server";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import db, { audioPath, alignPath, type BookRow } from "@/lib/db";
import { synthesizeBook, estimateSeconds } from "@/lib/elevenlabs";
import { mixWithBed } from "@/lib/mix";
import { authorized } from "@/lib/auth";
import { FALLBACK_VOICE, voiceName } from "@/lib/voices";
import { writeManifest } from "@/lib/manifest";

export const runtime = "nodejs";
export const maxDuration = 300;

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

export async function GET() {
  const rows = db
    .prepare(
      "SELECT id,title,author,body,voice_id,voice_name,has_audio,duration_sec,word_count,char_count,cover_prompt,music,created_at FROM books ORDER BY id DESC",
    )
    .all() as BookRow[];
  const coversDir = join(process.cwd(), "public", "covers");
  const out = rows.map((r) => ({
    ...r,
    has_cover: existsSync(join(coversDir, `${r.id}.png`)) ? 1 : 0,
  }));
  return NextResponse.json(out);
}

// Create a book. Body: { title, body, author?, voice_id?, voice?:false }
// Synthesizes ElevenLabs audio + per-character alignment (unless voice:false).
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const title = String(b.title || "Untitled").slice(0, 200).trim() || "Untitled";
  const body = String(b.body || "").trim();
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 });

  const voiceId = String(b.voice_id || process.env.BRIEFLY_VOICE_ID || FALLBACK_VOICE);
  const music = b.music === true ? 1 : 0; // clean narration by default; bed only if explicitly asked
  const info = db
    .prepare(
      "INSERT INTO books (title,author,body,voice_id,voice_name,duration_sec,word_count,char_count,music) VALUES (?,?,?,?,?,?,?,?,?)",
    )
    .run(
      title,
      b.author || null,
      body,
      voiceId,
      voiceName(voiceId),
      estimateSeconds(body),
      wordCount(body),
      body.length,
      music,
    );
  const id = Number(info.lastInsertRowid);

  if (b.voice !== false) {
    try {
      const { audio, alignment, duration } = await synthesizeBook(body, voiceId);
      writeFileSync(audioPath(id), audio);
      // paint a soft ambient bed under the voice (best-effort; leaves the dry
      // voice in place if ffmpeg is unavailable). Voice timing is untouched, so
      // the karaoke alignment written below still lines up exactly.
      if (music) await mixWithBed(audioPath(id), duration);
      // compact alignment: reconstructed text + rounded start/end times
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
      db.prepare("UPDATE books SET has_audio=1, duration_sec=? WHERE id=?").run(
        Math.round(duration),
        id,
      );
      writeManifest();
      return NextResponse.json({ id, has_audio: 1, duration_sec: Math.round(duration) }, { status: 201 });
    } catch (e) {
      writeManifest();
      return NextResponse.json({ id, has_audio: 0, warn: String(e) }, { status: 201 });
    }
  }

  writeManifest();
  return NextResponse.json({ id, has_audio: 0 }, { status: 201 });
}
