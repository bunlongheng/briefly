import { writeFileSync } from "fs";
import { join } from "path";
import db, { type BookRow } from "@/lib/db";

// Vercel's filesystem is read-only, so the deployed app can't hit the local
// sqlite DB. Instead we bake a static manifest (public/books.json) that the
// client falls back to. Regenerated on every create/delete and committed with
// the audio files.
export function writeManifest(): void {
  // Only PUBLISHED books ship to the static site; unpublished ones stay local.
  const rows = db
    .prepare(
      "SELECT id,title,author,body,voice_id,voice_name,has_audio,duration_sec,word_count,char_count,cover_prompt,published,music,created_at FROM books WHERE published=1 ORDER BY id DESC",
    )
    .all() as BookRow[];
  const out = join(process.cwd(), "public", "books.json");
  writeFileSync(out, JSON.stringify(rows));
}
