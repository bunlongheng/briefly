import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
// Audio + alignment live under public/ so Next serves them as STATIC files with
// native Range/206 support - the only thing iOS Safari <audio> reliably plays.
const PUB_AUDIO = join(process.cwd(), "public", "audio");

// Lazy singleton. We must NOT open the database at module load: the Vercel
// production build runs on Node 24, where better-sqlite3's native Statement
// destructor aborts (SIGABRT) when the build worker tears down. Opening the DB
// only on first real use keeps the build (which imports these route modules but
// never calls a query) from ever touching the native addon.
let _db: Database.Database | null = null;
function init(): Database.Database {
  if (_db) return _db;
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(PUB_AUDIO, { recursive: true });
  const d = new Database(join(DATA_DIR, "briefly.db"));
  d.pragma("journal_mode = WAL");
  d.exec(`
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
      d.exec(stmt);
    } catch {
      /* column already exists */
    }
  }
  _db = d;
  return d;
}

// Proxy so existing callers keep using `db.prepare(...)` unchanged, but the real
// connection is created on first property access (request time), never at build.
const db = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const real = init() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

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
