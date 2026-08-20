// ElevenLabs text-to-speech WITH per-character timestamps.
//
// The karaoke reader needs to know, at any playback moment, exactly which
// CHARACTER is being spoken (monkeytype-style caret). ElevenLabs' /with-timestamps
// endpoint returns character-level alignment, so highlighting is exact - not
// estimated from word lengths. Long books are chunked on sentence boundaries,
// synthesized per chunk, then the audio is concatenated and the per-chunk
// timings are offset by the running duration so the whole book stays in sync.

export type Alignment = {
  chars: string[]; // one entry per input character (in order)
  starts: number[]; // spoken start time (seconds) of each character
  ends: number[]; // spoken end time (seconds) of each character
};

export type Synth = { audio: Buffer; alignment: Alignment; duration: number };

const MODEL_ID = "eleven_turbo_v2_5"; // warm + natural, cheaper credits
const CHUNK_CHARS = 2200; // stay well under model input limits per request

// Split text into chunks <= CHUNK_CHARS, preferring sentence then word breaks
// so no chunk cuts a word in half (which would smear the alignment).
export function chunkText(text: string, max = CHUNK_CHARS): string[] {
  const clean = text.replace(/\r\n/g, "\n");
  if (clean.length <= max) return [clean];
  const chunks: string[] = [];
  let rest = clean;
  while (rest.length > max) {
    let cut = -1;
    // prefer the last sentence end within the window
    const window = rest.slice(0, max);
    const m = [...window.matchAll(/[.!?]["'”’)\]]?\s/g)];
    const lastSentence = m.length ? m[m.length - 1].index! + m[m.length - 1][0].length : -1;
    if (lastSentence > max * 0.4) cut = lastSentence;
    if (cut < 0) {
      const ws = window.lastIndexOf(" ");
      cut = ws > max * 0.4 ? ws + 1 : max;
    }
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.length) chunks.push(rest);
  return chunks;
}

async function synthChunk(text: string, voiceId: string, key: string): Promise<Synth> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    } | null;
  };

  const audio = Buffer.from(data.audio_base64, "base64");
  const a = data.alignment;
  const chars = a?.characters ?? [...text];
  const starts = a?.character_start_times_seconds ?? [];
  const ends = a?.character_end_times_seconds ?? [];
  const duration = ends.length ? ends[ends.length - 1] : estimateSeconds(text);
  return { audio, alignment: { chars, starts, ends }, duration };
}

// Full-book synthesis: chunk -> synth each -> stitch audio + offset timings.
export async function synthesizeBook(text: string, voiceId: string): Promise<Synth> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY not set");

  const parts = chunkText(text);
  const audioBufs: Buffer[] = [];
  const chars: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;

  for (const part of parts) {
    const s = await synthChunk(part, voiceId, key);
    audioBufs.push(s.audio);
    for (let i = 0; i < s.alignment.chars.length; i++) {
      chars.push(s.alignment.chars[i]);
      starts.push((s.alignment.starts[i] ?? 0) + offset);
      ends.push((s.alignment.ends[i] ?? 0) + offset);
    }
    offset += s.duration;
  }

  return {
    audio: Buffer.concat(audioBufs),
    alignment: { chars, starts, ends },
    duration: offset,
  };
}

// Rough spoken-length estimate: ~150 words per minute (fallback only).
export function estimateSeconds(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60);
}
