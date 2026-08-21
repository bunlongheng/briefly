import { headers } from "next/headers";

// Server-only helpers for the shareable /b/[id] route + its OG card. We read the
// PUBLISHED manifest (public/books.json) over HTTP from our own origin so this
// works both locally and on Vercel (where the sqlite DB isn't available).

export async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL || "https://briefly-bheng.vercel.app";
  const forwarded = h.get("x-forwarded-proto");
  const isLocal = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith(".local");
  const proto = forwarded || (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

export type ShareBook = {
  id: number;
  title: string;
  author: string | null;
  duration_sec: number | null;
  voice_name: string | null;
};

export async function getShareBook(id: number): Promise<ShareBook | null> {
  if (!Number.isFinite(id)) return null;
  try {
    const origin = await originFromHeaders();
    const r = await fetch(`${origin}/books.json`, { cache: "no-store" });
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr)) return null;
    const b = arr.find((x) => Number(x.id) === id);
    if (!b) return null;
    return {
      id: Number(b.id),
      title: String(b.title ?? "Untitled"),
      author: (b.author as string) ?? null,
      duration_sec: (b.duration_sec as number) ?? null,
      voice_name: (b.voice_name as string) ?? null,
    };
  } catch {
    return null;
  }
}
