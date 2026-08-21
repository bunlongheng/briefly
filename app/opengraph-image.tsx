import { ImageResponse } from "next/og";
import { originFromHeaders } from "@/lib/share-data";

export const alt = "Briefly - read along, out loud, karaoke style";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Home share card: a phone mockup showing briefly's signature karaoke read-along
// (per-word yellow highlight + caret) next to the wordmark + tagline. Rich and
// polished, in the monkeytype serika palette.
export default async function Image() {
  const YELLOW = "#e2b714";
  const BG = "#2b2d30";
  const SCREEN = "#323437";
  const TEXT = "#d1d0c5";
  const SUB = "#646669";

  // Pull one real book (cover + title + a text snippet) for the phone screen.
  let cover: string | null = null;
  let title = "Think and Grow Rich";
  let author = "Napoleon Hill";
  let snippet = "This book is not really about money. It is about how a burning desire turns an idea into a result.";
  try {
    const origin = await originFromHeaders();
    const r = await fetch(`${origin}/books.json`, { cache: "no-store" });
    if (r.ok) {
      const arr = (await r.json()) as Array<{ id: number; title: string; author: string | null; body: string }>;
      const b = arr[0];
      if (b) {
        title = b.title || title;
        author = b.author || author;
        const clean = (b.body || "").replace(/\s+/g, " ").trim();
        // skip a leading "Title - ..." headline; grab the first real sentence-ish run
        const after = clean.replace(/^[^.]*\.\s*/, "");
        snippet = (after || clean).slice(0, 150);
        try {
          const cr = await fetch(`${origin}/covers/${b.id}.png`, { cache: "no-store" });
          if (cr.ok) cover = `data:image/png;base64,${Buffer.from(await cr.arrayBuffer()).toString("base64")}`;
        } catch {
          /* monogram fallback below */
        }
      }
    }
  } catch {
    /* static defaults render fine */
  }

  const words = snippet.split(" ").filter(Boolean);
  const active = Math.min(7, words.length - 1); // pretend playback is at word 7
  const letter = (title.trim()[0] || "?").toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 76px",
          background: `radial-gradient(900px 900px at 92% 8%, rgba(226,183,20,0.14) 0%, rgba(226,183,20,0) 55%), radial-gradient(1000px 700px at 10% 120%, #34363a 0%, ${BG} 60%)`,
          color: TEXT,
          fontFamily: "monospace",
        }}
      >
        {/* phone mockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 330,
            height: 496,
            flexShrink: 0,
            padding: 16,
            borderRadius: 46,
            background: "#1c1d1f",
            border: "1px solid #3a3c40",
            boxShadow: "0 44px 90px rgba(0,0,0,0.55)",
            transform: "rotate(-4deg)",
          }}
        >
          {/* screen */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              borderRadius: 32,
              background: SCREEN,
              padding: "20px 18px",
              overflow: "hidden",
            }}
          >
            {/* screen header: cover + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  width: 48,
                  height: 48,
                  borderRadius: 11,
                  overflow: "hidden",
                  background: "#232527",
                  alignItems: "center",
                  justifyContent: "center",
                  color: YELLOW,
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                {cover ? <img src={cover} width={48} height={48} alt="" style={{ objectFit: "cover" }} /> : letter}
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</div>
                <div style={{ fontSize: 12, color: SUB }}>{author}</div>
              </div>
            </div>

            {/* karaoke lines */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignContent: "flex-start",
                gap: "6px 8px",
                marginTop: 22,
                flex: 1,
                fontSize: 19,
                lineHeight: 1.5,
              }}
            >
              {words.slice(0, 16).map((w, i) => (
                <span
                  key={i}
                  style={{
                    display: "flex",
                    color: i === active ? BG : i < active ? TEXT : SUB,
                    background: i === active ? YELLOW : "transparent",
                    borderRadius: 5,
                    padding: i === active ? "1px 5px" : "1px 0",
                    fontWeight: i === active ? 700 : 500,
                  }}
                >
                  {w}
                </span>
              ))}
            </div>

            {/* transport */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: YELLOW,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={BG}>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              </div>
              <div style={{ display: "flex", flex: 1, height: 4, borderRadius: 999, background: "#26282b" }}>
                <div style={{ display: "flex", width: "42%", height: 4, borderRadius: 999, background: YELLOW }} />
              </div>
            </div>
          </div>
        </div>

        {/* text column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ color: YELLOW, fontSize: 78, fontWeight: 800 }}>{">"}</span>
            <span style={{ fontSize: 78, fontWeight: 800, letterSpacing: -2, color: "#fff" }}>briefly</span>
            <span style={{ color: YELLOW, fontSize: 78, fontWeight: 800 }}>_</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 30, color: TEXT, marginTop: 20, lineHeight: 1.45, maxWidth: 560 }}>
            <span>Hear any text read aloud and follow </span>
            <span style={{ color: YELLOW }}>&nbsp;every word&nbsp;</span>
            <span> as it lands - karaoke style.</span>
          </div>

          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 34,
              padding: "12px 22px",
              borderRadius: 999,
              background: "rgba(226,183,20,0.12)",
              border: "1px solid rgba(226,183,20,0.35)",
              color: YELLOW,
              fontSize: 21,
              fontWeight: 600,
            }}
          >
            paste text · press play · follow along
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
