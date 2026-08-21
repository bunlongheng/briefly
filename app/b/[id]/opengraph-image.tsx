import { ImageResponse } from "next/og";
import { getShareBook, originFromHeaders } from "@/lib/share-data";
import { mmss } from "@/lib/types";

export const alt = "Briefly - read along, out loud";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A "story time" style share card: the book's real cover on the left, title +
// author + a play pill on the right, all in the monkeytype serika palette.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getShareBook(Number(id));

  // Pull the real cover art over HTTP (reliable on Vercel's CDN) and inline it.
  let coverSrc: string | null = null;
  try {
    const origin = await originFromHeaders();
    const r = await fetch(`${origin}/covers/${id}.png`, { cache: "no-store" });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      coverSrc = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch {
    /* fall back to a monogram tile */
  }

  const title = b?.title || "Briefly";
  const author = b?.author || "";
  const letter = (title.trim()[0] || "?").toUpperCase();
  const meta = [
    b?.duration_sec ? `${mmss(b.duration_sec)} listen` : null,
    b?.voice_name ? `narrated by ${b.voice_name}` : null,
  ]
    .filter(Boolean)
    .join("      ·      ");

  const YELLOW = "#e2b714";
  const BG = "#2c2e31";
  const TEXT = "#d1d0c5";
  const SUB = "#7c7f83";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 72,
          background: `radial-gradient(1200px 600px at 78% -10%, #3a3c40 0%, ${BG} 55%)`,
          color: TEXT,
          fontFamily: "monospace",
        }}
      >
        {/* cover */}
        <div
          style={{
            width: 420,
            height: 420,
            flexShrink: 0,
            display: "flex",
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid #3a3c40",
            boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
            background: "#232527",
          }}
        >
          {coverSrc ? (
            <img src={coverSrc} width={420} height={420} alt="" style={{ objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: YELLOW,
                fontSize: 200,
                fontWeight: 800,
              }}
            >
              {letter}
            </div>
          )}
        </div>

        {/* text column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <span style={{ color: YELLOW, fontSize: 34, fontWeight: 800 }}>{">"}</span>
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>briefly</span>
          </div>

          <div
            style={{
              fontSize: title.length > 34 ? 58 : 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
              color: "#ffffff",
              display: "block",
              maxHeight: 240,
              overflow: "hidden",
            }}
          >
            {title}
          </div>

          {author ? (
            <div style={{ fontSize: 34, color: YELLOW, marginTop: 22, fontWeight: 600 }}>{author}</div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 999,
                background: YELLOW,
                color: BG,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={BG} style={{ marginLeft: 4 }}>
                <path d="M8 5l11 7-11 7z" />
              </svg>
            </div>
            <span style={{ fontSize: 24, color: SUB }}>
              {meta || "read along, out loud - karaoke style"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
