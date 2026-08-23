"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import { mmss } from "@/lib/types";
import { SHELVES, catOf } from "@/lib/categories";
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

function EmptyState() {
  return (
    <div style={{ maxWidth: 620, margin: "6vh auto 0", animation: "rise .4s ease" }}>
      <div className="dim" style={{ fontSize: 13, marginBottom: 8 }}>
        {"// nothing here yet"}
      </div>
      <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", margin: "0 0 8px", fontWeight: 800, letterSpacing: "-0.01em" }}>
        great books, <span className="accent">in 5 minutes</span>.
      </h1>
      <p className="dim" style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 26px" }}>
        no time for the whole book? briefly reads you the big ideas out loud and lights up every
        word as it lands - so you can follow along and actually remember it.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14, fontSize: 15 }}>
        <Feature k="01">real voice narration with natural, warm delivery</Feature>
        <Feature k="02">per-word karaoke highlight, synced to the exact audio moment</Feature>
        <Feature k="03">click any word to jump straight to it - scrub by meaning, not seconds</Feature>
        <Feature k="04">adjustable speed, light + dark, works great on your phone</Feature>
      </ul>
    </div>
  );
}

function DeleteBtn({ book, onDelete }: { book: Book; onDelete: (id: number) => void }) {
  return (
    <button
      className="book-del focus-ring"
      aria-label={`Delete ${book.title}`}
      title="Delete"
      onClick={(e) => {
        e.stopPropagation();
        if (confirm(`Delete "${book.title}"? This removes its audio too.`)) onDelete(book.id);
      }}
      style={{
        position: "absolute",
        top: 6,
        right: 6,
        zIndex: 2,
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
  );
}

// speed-dial tile: cover fills the tile, title overlaid on a bottom gradient
function Tile({
  book,
  onOpen,
  onDelete,
}: {
  book: Book;
  onOpen: (b: Book) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(book)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(book)}
      className="yt-tile focus-ring"
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--card)",
        border: "1px solid var(--sub-alt)",
      }}
    >
      {onDelete && <DeleteBtn book={book} onDelete={onDelete} />}
      <Cover
        id={book.id}
        title={book.title}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          padding: "26px 9px 8px",
          background: "linear-gradient(transparent, rgba(0,0,0,.82))",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            maxHeight: "2.5em",
            overflow: "hidden",
          }}
        >
          {book.title}
        </div>
      </div>
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 6,
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: 5,
          background: "rgba(0,0,0,.62)",
          color: "#fff",
        }}
      >
        {mmss(book.duration_sec ?? 0)}
      </span>
    </div>
  );
}

// shelf card: cover with title + meta beneath (YT playlist-card style)
function ShelfCard({
  book,
  onOpen,
  onDelete,
}: {
  book: Book;
  onOpen: (b: Book) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(book)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(book)}
      className="yt-tile focus-ring"
      style={{ position: "relative", width: 148, flexShrink: 0, cursor: "pointer", scrollSnapAlign: "start" }}
    >
      {onDelete && <DeleteBtn book={book} onDelete={onDelete} />}
      <Cover
        id={book.id}
        title={book.title}
        style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 12, objectFit: "cover", border: "1px solid var(--sub-alt)" }}
      />
      <div style={{ marginTop: 7, fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxHeight: "2.6em", overflow: "hidden" }}>
        {book.title}
      </div>
      <div className="dim" style={{ fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {mmss(book.duration_sec ?? 0)}
        {book.author ? ` · ${book.author}` : ""}
      </div>
    </div>
  );
}

export default function Menu({
  books,
  loading,
  lastPlayedId,
  onOpen,
  onDelete,
}: {
  books: Book[];
  loading: boolean;
  lastPlayedId?: number | null;
  onOpen: (b: Book) => void;
  onDelete?: (id: number) => void;
}) {
  const [chip, setChip] = useState("all");

  const chips = useMemo(() => {
    const present = new Set(books.map((b) => catOf(b.id)));
    return ["all", ...SHELVES.filter((s) => present.has(s))];
  }, [books]);

  // speed dial: last played first, then newest
  const dial = useMemo(() => {
    const sorted = [...books].sort((a, b) => b.id - a.id);
    const last = sorted.find((b) => b.id === lastPlayedId);
    const rest = sorted.filter((b) => b.id !== lastPlayedId);
    return (last ? [last, ...rest] : rest).slice(0, 9);
  }, [books, lastPlayedId]);

  const shelves = useMemo(
    () =>
      SHELVES.map((s) => ({ name: s, items: books.filter((b) => catOf(b.id) === s) })).filter(
        (s) => s.items.length > 0,
      ),
    [books],
  );

  const filtered = useMemo(
    () => (chip === "all" ? books : books.filter((b) => catOf(b.id) === chip)),
    [books, chip],
  );

  if (loading) {
    return (
      <p className="dim" style={{ textAlign: "center", marginTop: "20vh" }}>
        loading…
      </p>
    );
  }
  if (books.length === 0) return <EmptyState />;

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", animation: "rise .3s ease" }}>
      {/* chip row */}
      <div
        className="chip-row"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "2px 2px 14px",
          scrollbarWidth: "none",
        }}
      >
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setChip(c)}
            className="focus-ring"
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              background: chip === c ? "var(--main)" : "var(--card)",
              color: chip === c ? "var(--bg-deep)" : "var(--text)",
              border: "1px solid var(--sub-alt)",
              transition: "background .15s ease, color .15s ease",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {chip !== "all" ? (
        /* filtered view: plain tile grid for the picked chip */
        <div className="dial-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(var(--dial-cols, 3), minmax(0, 1fr))" }}>
          {filtered.map((b) => (
            <Tile key={b.id} book={b} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <>
          {/* speed dial */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 14px" }}>
            <div>
              <div className="dim" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
                {"// briefly library"}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em" }}>speed dial</div>
            </div>
          </div>
          <div className="dial-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(var(--dial-cols, 3), minmax(0, 1fr))" }}>
            {dial.map((b) => (
              <Tile key={b.id} book={b} onOpen={onOpen} onDelete={onDelete} />
            ))}
          </div>

          {/* category shelves */}
          {shelves.map((s) => (
            <section key={s.name} style={{ marginTop: 30 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
                {s.name}
              </h2>
              <div
                className="chip-row"
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 6,
                  scrollSnapType: "x proximity",
                  scrollbarWidth: "none",
                }}
              >
                {s.items.map((b) => (
                  <ShelfCard key={b.id} book={b} onOpen={onOpen} onDelete={onDelete} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <style>{`
        .chip-row::-webkit-scrollbar { display: none; }
        @media (min-width: 760px) { .dial-grid { --dial-cols: 6; } }
        .yt-tile { transition: transform .15s ease; }
        .yt-tile:hover { transform: translateY(-3px); }
        .book-del { opacity: 0; transition: opacity .15s ease, color .15s ease, background .15s ease; }
        .yt-tile:hover .book-del, .book-del:focus-visible { opacity: 1; }
        .book-del:hover { color: var(--error); }
        @media (hover: none) { .book-del { opacity: 1; } }
      `}</style>
    </div>
  );
}
