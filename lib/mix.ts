import { spawn } from "child_process";
import { existsSync, renameSync } from "fs";
import { bedPath } from "@/lib/db";

// Mix a soft ambient bed UNDER the finished narration. The bed sits ~19 dB below
// the voice and sidechain-ducks whenever the voice speaks (so narration always
// sits on top), with gentle in/out fades. Crucially the voice track is never
// time-shifted, so the per-character karaoke alignment stays exactly valid - we
// just paint atmosphere beneath it. Overwrites `voicePath` with the mixed MP3.
// Returns false (leaving the dry voice in place) if ffmpeg or the bed is missing.
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

export function mixWithBed(voicePath: string, durationSec: number): Promise<boolean> {
  const bed = bedPath();
  if (!existsSync(voicePath) || !existsSync(bed)) return Promise.resolve(false);

  const d = Math.max(2, durationSec || 0);
  const fadeOut = Math.max(0, d - 1.5);
  const filter =
    `[1:a]atrim=0:${(d + 2).toFixed(2)},volume=-19dB,` +
    `afade=t=in:st=0:d=1.5,afade=t=out:st=${fadeOut.toFixed(2)}:d=2[bed];` +
    `[bed][0:a]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[duck];` +
    `[0:a][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[out]`;

  const tmp = voicePath.replace(/\.mp3$/, ".mix.mp3");
  const args = [
    "-y", "-v", "error",
    "-i", voicePath,
    "-stream_loop", "-1", "-i", bed, // loop the short bed to cover the whole book
    "-filter_complex", filter,
    "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "128k",
    tmp,
  ];

  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    let proc;
    try {
      // turbopackIgnore stops Turbopack from statically tracing this dynamic
      // spawn, which otherwise pulls the ENTIRE public/ folder (all book audio)
      // into the serverless function bundle and blows Vercel's size limit.
      proc = spawn(/*turbopackIgnore: true*/ FFMPEG, args);
    } catch {
      return finish(false);
    }
    proc.on("error", () => finish(false)); // ffmpeg not installed / not on PATH
    proc.on("close", (code) => {
      if (code === 0 && existsSync(tmp)) {
        try {
          renameSync(tmp, voicePath);
          return finish(true);
        } catch {
          /* fall through */
        }
      }
      finish(false);
    });
  });
}
