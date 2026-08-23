"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/types";
import Cover from "./Cover";

// YT-Music-style sticky bottom bar. Owns its own <audio> so playback can be
// controlled straight from the library (the Reader is never mounted at the
// same time, so the 2 audio elements can't fight). Tapping the bar hands the
// current position to the Reader for the full karaoke view.
export default function MiniPlayer({
  book,
  startAt,
  onExpand,
}: {
  book: Book;
  startAt: number;
  onExpand: (b: Book, t: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(
    book.duration_sec ? (startAt / book.duration_sec) * 100 : 0,
  );

  const save = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    try {
      if (a.ended || a.currentTime >= a.duration - 2) localStorage.removeItem("briefly:last");
      else if (a.currentTime > 1)
        localStorage.setItem("briefly:last", JSON.stringify({ id: book.id, t: a.currentTime }));
    } catch {
      /* private mode - progress just won't persist */
    }
  }, [book.id]);

  // new book in the bar -> reload + seek to its saved spot
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.load();
    const seek = () => {
      a.currentTime = startAt;
    };
    a.addEventListener("loadedmetadata", seek);
    return () => a.removeEventListener("loadedmetadata", seek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(save, 3000);
    return () => {
      clearInterval(iv);
      save();
    };
  }, [playing, save]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else {
      a.pause();
      setPlaying(false);
      save();
    }
  }, [save]);

  const expand = useCallback(() => {
    const a = audioRef.current;
    const t = a && a.currentTime > 0 ? a.currentTime : startAt;
    a?.pause();
    save();
    onExpand(book, t);
  }, [book, onExpand, save, startAt]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        background: "color-mix(in srgb, var(--bg-deep) 88%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid var(--sub-alt)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* thin progress line across the top of the bar */}
      <div style={{ height: 2, background: "var(--sub-alt)" }}>
        <div
          style={{
            height: 2,
            width: `${Math.min(100, pct)}%`,
            background: "var(--main)",
            transition: "width .25s linear",
          }}
        />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={expand}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && expand()}
        className="focus-ring"
        aria-label={`Open ${book.title}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px max(16px, env(safe-area-inset-right)) 8px max(16px, env(safe-area-inset-left))",
          maxWidth: 1040,
          margin: "0 auto",
          cursor: "pointer",
        }}
      >
        <Cover
          id={book.id}
          title={book.title}
          style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", flexShrink: 0, fontSize: 8 }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.title}
          </div>
          <div className="dim" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.author || book.voice_name}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="focus-ring"
          aria-label={playing ? "Pause" : "Play"}
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "var(--text)",
          }}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
      <audio
        ref={audioRef}
        src={`/audio/${book.id}.mp3`}
        preload="metadata"
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setPct((a.currentTime / a.duration) * 100);
        }}
        onEnded={() => {
          setPlaying(false);
          save();
        }}
      />
    </div>
  );
}
