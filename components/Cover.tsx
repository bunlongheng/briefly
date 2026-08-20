"use client";

import { useState } from "react";

// Book cover: real art from /covers/{id}.png when present, else a typographic
// monogram tile in the monkeytype palette (no external assets, CSP-safe).
export default function Cover({
  id,
  title,
  className,
  style,
}: {
  id: number;
  title?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [broken, setBroken] = useState(false);
  const letter = (title || "?").trim().charAt(0).toUpperCase() || "?";

  if (broken) {
    return (
      <div
        className={className}
        style={{
          display: "grid",
          placeItems: "center",
          background: "var(--bg-deep)",
          border: "1px solid var(--sub-alt)",
          color: "var(--main)",
          fontFamily: "var(--mono)",
          fontWeight: 700,
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
      >
        <span style={{ position: "absolute", top: 8, left: 10, fontSize: 11, color: "var(--sub)" }}>
          {"//"}
        </span>
        <span style={{ fontSize: "2.4em", lineHeight: 1 }}>{letter}</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`/covers/${id}.png`}
      alt=""
      className={className}
      style={style}
      onError={() => setBroken(true)}
    />
  );
}
