export type Book = {
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
  music?: number;
  created_at: string;
  has_cover?: number;
};

// Per-character alignment served from /audio/{id}.json
export type AlignFile = {
  v: number;
  duration: number;
  text: string;
  starts: number[];
  ends: number[];
};

export const mmss = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};
