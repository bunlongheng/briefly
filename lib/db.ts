import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
// Audio + alignment live under public/ so Next serves them as STATIC files with
// native Range/206 support - the only thing iOS Safari <audio> reliably plays.
const PUB_AUDIO = join(process.cwd(), "public", "audio");
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(PUB_AUDIO, { recursive: true });

const db = new Database(join(DATA_DIR, "briefly.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS books (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  author       TEXT,
  body         TEXT NOT NULL,
  voice_id     TEXT,
  voice_name   TEXT,
  has_audio    INTEGER DEFAULT 0,
  duration_sec REAL,
  word_count   INTEGER,
  char_count   INTEGER,
  cover_prompt TEXT,
  published    INTEGER DEFAULT 1,
  music        INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT (datetime('now'))
);
`);

// migrations for older DBs (each is a no-op once the column exists)
for (const stmt of [
  "ALTER TABLE books ADD COLUMN published INTEGER DEFAULT 1", // publish flag: local-only vs on the site
  "ALTER TABLE books ADD COLUMN music INTEGER DEFAULT 1", // ambient bed mixed under the narration
]) {
  try {
    db.exec(stmt);
  } catch {
    /* column already exists */
  }
}

// server-side ambient bed mixed under the narration (never served to the client)
export const bedPath = () => join(process.cwd(), "assets", "beds", "warm.mp3");

// on-disk paths (written by the API) + public URLs (read by the browser)
export const audioPath = (id: number | string) => join(PUB_AUDIO, `${id}.mp3`);
export const alignPath = (id: number | string) => join(PUB_AUDIO, `${id}.json`);
export const audioUrl = (id: number | string) => `/audio/${id}.mp3`;
export const alignUrl = (id: number | string) => `/audio/${id}.json`;

export type BookRow = {
  id: number;
  title: string;
  author: string | null;
  body: string;
  voice_id: string | null;
  voice_name: string | null;
  has_audio: number;
  duration_sec: number | null;
  word_count: number | null;
  char_count: number | null;
  cover_prompt: string | null;
  published: number;
  music: number;
  created_at: string;
};

export default db;
