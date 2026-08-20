// Karaoke model shared by the reader UI and the unit tests.
//
// A book is tokenized into paragraphs -> words, where every word carries `ci`,
// the GLOBAL character index of its first character in `body`. ElevenLabs gives
// us `starts[i]` = the spoken start time of body character i, so at playback
// time `t` we binary-search for the active character, then map that back to the
// active word and how many of its characters have already been spoken. That is
// what drives the monkeytype-style caret + per-character highlight.

export type Tok = { w: string; ci: number };
export type Kara = { paras: Tok[][]; words: number; chars: number };

// Build paragraph/word tokens with global char offsets. Whitespace runs are
// preserved implicitly via `ci` so caret math stays exact against `starts`.
export function buildKaraoke(body: string): Kara {
  const text = (body || "").replace(/\r\n/g, "\n");
  const paras: Tok[][] = [];
  let words = 0;
  // walk the raw string so `ci` is a true index into `text`/`starts`
  const paraChunks: { text: string; offset: number }[] = [];
  {
    let off = 0;
    for (const part of text.split(/(\n+)/)) {
      if (part && !/^\n+$/.test(part)) paraChunks.push({ text: part, offset: off });
      off += part.length;
    }
  }
  for (const { text: p, offset } of paraChunks) {
    const row: Tok[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(p))) {
      row.push({ w: m[0], ci: offset + m.index });
      words++;
    }
    if (row.length) paras.push(row);
  }
  return { paras, words, chars: text.length };
}

// Last character index whose spoken start time is <= t (binary search). -1 before
// the first character begins. `starts` must be non-decreasing.
export function charIndexAt(starts: number[], t: number): number {
  if (!starts.length || t < starts[0]) return -1;
  let lo = 0;
  let hi = starts.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

// Classify a word relative to the active character index.
//  - "done":   the whole word has been spoken
//  - "active": the caret is inside this word (typed = chars already spoken)
//  - "future": not reached yet
export type WordState = { state: "done" | "active" | "future"; typed: number };
export function wordState(tok: Tok, activeChar: number): WordState {
  const end = tok.ci + tok.w.length - 1;
  if (activeChar < tok.ci) return { state: "future", typed: 0 };
  if (activeChar >= end) return { state: "done", typed: tok.w.length };
  return { state: "active", typed: activeChar - tok.ci + 1 };
}

// 1-based index of the word currently being spoken (for the big counter).
export function activeWordNumber(kara: Kara, activeChar: number): number {
  if (activeChar < 0) return 0;
  let n = 0;
  for (const row of kara.paras) {
    for (const tok of row) {
      if (tok.ci <= activeChar) n++;
      else return n;
    }
  }
  return n;
}
