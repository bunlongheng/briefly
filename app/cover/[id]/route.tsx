import { ImageResponse } from "next/og";
import { getShareBook } from "@/lib/share-data";

export const runtime = "nodejs";

// Auto cover generator: a clean typographic tile for any book that has no cover
// art. Square, serika palette, a per-book accent so the shelf has variety while
// staying on-brand. Used to bake static /covers/{id}.png files.
const SIZE = 720;
const ACCENTS = [
  "#e2b714", // signature yellow
  "#7fb3d5", // soft blue
  "#e0876a", // warm coral
  "#82c99a", // sage
  "#b79cd6", // lavender
  "#d97f9a", // rose
  "#6fc3c0", // teal
  "#e6a94e", // amber
  "#9db06a", // olive
  "#cf8fa6", // mauve
];

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const nid = Number(id);
  const b = await getShareBook(nid);
  const title = (b?.title || "Briefly").trim();
  const author = (b?.author || "").trim();
  const accent = ACCENTS[Math.abs(nid) % ACCENTS.length] || "#e2b714";
  const letter = (title[0] || "?").toUpperCase();
  const bg = "#26282b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: `radial-gradient(680px 520px at 80% -12%, ${accent}2b 0%, ${accent}00 58%), linear-gradient(160deg, #303236 0%, ${bg} 60%)`,
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* faint monogram watermark */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -120,
            fontSize: 560,
            fontWeight: 800,
            color: accent,
            opacity: 0.08,
            display: "flex",
          }}
        >
          {letter}
        </div>

        {/* top: brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: accent, fontSize: 40, fontWeight: 800 }}>{">"}</span>
          <span style={{ color: "#9a9c9f", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>briefly</span>
        </div>

        {/* bottom: title + author */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 64, height: 6, borderRadius: 999, background: accent, marginBottom: 26 }} />
          <div
            style={{
              fontSize: title.length > 24 ? 58 : 72,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -1.5,
              color: "#f2f1ea",
              display: "block",
              maxWidth: 600,
            }}
          >
            {title}
          </div>
          {author ? (
            <div style={{ fontSize: 30, color: accent, marginTop: 22, fontWeight: 600 }}>{author}</div>
          ) : null}
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
