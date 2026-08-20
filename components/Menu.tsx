"use client";

import type { Book } from "@/lib/types";
import { mmss } from "@/lib/types";
import Cover from "./Cover";

function Feature({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <span className="accent" style={{ fontWeight: 700, flexShrink: 0 }}>
        {k}
      </span>
      <span style={{ color: "var(--text)" }}>{children}</span>
    </li>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ maxWidth: 620, margin: "6vh auto 0", animation: "rise .4s ease" }}>
      <div className="dim" style={{ fontSize: 13, marginBottom: 8 }}>
        {"// no books yet"}
      </div>
      <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", margin: "0 0 8px", fontWeight: 800, letterSpacing: "-0.01em" }}>
        read along, <span className="accent">out loud</span>.
      </h1>
      <p className="dim" style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 26px" }}>
        briefly turns any text into a narrated, karaoke-style read-along. paste a chapter, an
        article, or your own writing - hear it spoken and follow every word as it lands.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px", display: "grid", gap: 14, fontSize: 15 }}>
        <Feature k="01">real voice narration with natural, warm delivery</Feature>
        <Feature k="02">per-word karaoke highlight, synced to the exact audio moment</Feature>
        <Feature k="03">click any word to jump straight to it - scrub by meaning, not seconds</Feature>
        <Feature k="04">adjustable speed, light + dark, works great on your phone</Feature>
      </ul>
      <button
        onClick={onAdd}
        className="focus-ring"
        style={{
          background: "var(--main)",
          color: "var(--bg)",
          fontWeight: 700,
          padding: "12px 22px",
          borderRadius: 10,
          fontSize: 15,
        }}
      >
        paste your first text →
      </button>
    </div>
  );
}

export default function Menu({
  books,
  loading,
  onOpen,
  onAdd,
  onDelete,
}: {
  books: Book[];
  loading: boolean;
  onOpen: (b: Book) => void;
  onAdd: () => void;
  onDelete?: (id: number) => void;
}) {
  if (loading) {
    return (
      <p className="dim" style={{ textAlign: "center", marginTop: "20vh" }}>
        loading…
      </p>
    );
  }
  if (books.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", animation: "rise .3s ease" }}>
      <div className="dim" style={{ fontSize: 13, margin: "0 4px 16px" }}>
        {"// "}
        {books.length} book{books.length === 1 ? "" : "s"}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 14,
        }}
      >
        {books.map((b) => (
          <div
            key={b.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(b)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(b)}
            className="book-card focus-ring"
            style={{
              position: "relative",
              textAlign: "left",
              background: "var(--card)",
              border: "1px solid var(--sub-alt)",
              borderRadius: 12,
              padding: 9,
              display: "flex",
              flexDirection: "column",
              gap: 9,
              cursor: "pointer",
              transition: "transform .15s ease, border-color .15s ease, background .15s ease",
            }}
          >
            {onDelete && (
              <button
                className="book-del focus-ring"
                aria-label={`Delete ${b.title}`}
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${b.title}"? This removes its audio too.`)) onDelete(b.id);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  display: "grid",
                  placeItems: "center",
                  background: "color-mix(in srgb, var(--bg-deep) 78%, transparent)",
                  color: "var(--sub)",
                  backdropFilter: "blur(2px)",
                }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
            )}
            <Cover
              id={b.id}
              title={b.title}
              className="book-cover"
              style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 10, objectFit: "cover" }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {b.title}
              </div>
              <div
                className="dim"
                style={{
                  fontSize: 10.5,
                  marginTop: 3,
                  display: "flex",
                  gap: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span>{mmss(b.duration_sec ?? 0)}</span>
                {b.author ? (
                  <>
                    <span>·</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{b.author}</span>
                  </>
                ) : null}
                {!b.has_audio ? <span style={{ color: "var(--error)" }}>· no audio</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .book-card:hover {
          transform: translateY(-3px);
          border-color: var(--main);
          background: var(--card-hi);
        }
        .book-del { opacity: 0; transition: opacity .15s ease, color .15s ease, background .15s ease; }
        .book-card:hover .book-del, .book-del:focus-visible { opacity: 1; }
        .book-del:hover { color: var(--error); }
        @media (hover: none) { .book-del { opacity: 1; } }
      `}</style>
    </div>
  );
}
