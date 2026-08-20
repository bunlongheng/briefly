"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlignFile, Book } from "@/lib/types";
import { mmss } from "@/lib/types";
import { activeWordNumber, buildKaraoke, charIndexAt, wordState } from "@/lib/karaoke";

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export default function Reader({
  book,
  onBack,
  startAt = 0,
}: {
  book: Book;
  onBack: () => void;
  startAt?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [align, setAlign] = useState<AlignFile | null>(null);
  const [activeChar, setActiveChar] = useState(-1);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(book.duration_sec || 0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [ready, setReady] = useState(false);

  // Load per-character alignment. Fall back to a linear estimate over the body
  // text if the file is missing (e.g. audio was generated without timestamps).
  useEffect(() => {
    let cancelled = false;
    setAlign(null);
    setReady(false);
    fetch(`/audio/${book.id}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AlignFile | null) => {
        if (cancelled) return;
        if (d && Array.isArray(d.starts) && d.text) {
          setAlign(d);
          if (d.duration) setDur(d.duration);
        } else {
          // linear fallback: distribute duration evenly across characters
          const text = book.body;
          const n = text.length || 1;
          const D = book.duration_sec || 1;
          setAlign({
            v: 0,
            duration: D,
            text,
            starts: Array.from({ length: n }, (_, i) => (i / n) * D),
            ends: Array.from({ length: n }, (_, i) => ((i + 1) / n) * D),
          });
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [book.id, book.body, book.duration_sec]);

  const kara = useMemo(() => buildKaraoke(align?.text || book.body), [align?.text, book.body]);
  const starts = align?.starts;
  const lastCi = useRef(-1);

  // jump to a shared/deep-linked position once timing is available (runs once)
  const seeked = useRef(false);
  useEffect(() => {
    if (seeked.current || !ready || !starts || startAt <= 0) return;
    seeked.current = true;
    const ci = charIndexAt(starts, startAt);
    lastCi.current = ci;
    setActiveChar(ci);
    setCur(startAt);
    const a = audioRef.current;
    if (a) a.currentTime = startAt;
  }, [ready, starts, startAt]);

  // Smooth caret: while playing, read audio time each frame and only re-render
  // when the active CHARACTER changes (keeps long books cheap).
  useEffect(() => {
    if (!playing || !starts) return;
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      if (a) {
        const ci = charIndexAt(starts, a.currentTime);
        if (ci !== lastCi.current) {
          lastCi.current = ci;
          setActiveChar(ci);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, starts]);

  // keep the active line centered
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const wordNo = activeWordNumber(kara, activeChar);
  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [wordNo]);

  const applyRate = useCallback((r: number) => {
    setRate(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  // seek helper - also snaps the caret immediately (don't wait for the rAF loop)
  const seekTo = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a || !isFinite(t)) return;
      a.currentTime = Math.max(0, Math.min(dur || a.duration || t, t));
      setCur(a.currentTime);
      if (starts) {
        const ci = charIndexAt(starts, a.currentTime);
        lastCi.current = ci;
        setActiveChar(ci);
      }
    },
    [dur, starts],
  );

  // click a word to jump straight to it (seamless karaoke navigation)
  const seekWord = useCallback(
    (ci: number) => {
      if (starts && starts[ci] != null) seekTo(starts[ci]);
    },
    [seekTo, starts],
  );

  // keyboard: space play/pause, esc back, arrows scrub
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape") {
        onBack();
      } else if (e.key === "ArrowLeft") {
        seekTo((audioRef.current?.currentTime || 0) - 5);
      } else if (e.key === "ArrowRight") {
        seekTo((audioRef.current?.currentTime || 0) + 5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, onBack, seekTo]);

  const pct = dur ? (cur / dur) * 100 : 0;

  // render a word given the active-char position
  let flat = -1;
  const renderWord = (tok: { w: string; ci: number }) => {
    flat++;
    const { state, typed } = wordState(tok, activeChar);
    const isActive = state === "active";
    const color =
      state === "done" ? "var(--text)" : state === "future" ? "var(--sub)" : "var(--text)";
    return (
      <span
        key={tok.ci}
        ref={isActive ? activeWordRef : null}
        onClick={() => seekWord(tok.ci)}
        className="k-word"
        style={{ color, cursor: "pointer" }}
      >
        {isActive
          ? [...tok.w].map((ch, j) => {
              const isCurrent = j === typed - 1;
              const spoken = j < typed - 1;
              return (
                <span key={j} style={{ position: "relative" }}>
                  {isCurrent && <span className="k-caret" aria-hidden="true" />}
                  <span
                    style={{
                      color: isCurrent ? "var(--error)" : spoken ? "var(--text)" : "var(--sub)",
                    }}
                  >
                    {ch}
                  </span>
                </span>
              );
            })
          : tok.w}{" "}
      </span>
    );
  };

  return (
    <div
      style={{
        height: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid var(--sub-alt)",
        }}
      >
        <button
          onClick={onBack}
          className="focus-ring"
          style={{ color: "var(--sub)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--main)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          esc
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.title}
          </div>
          {book.author && <div className="dim" style={{ fontSize: 12 }}>{book.author}</div>}
        </div>
        <span className="dim" style={{ marginLeft: "auto", fontSize: 12, whiteSpace: "nowrap" }}>
          {book.voice_name}
        </span>
      </header>

      {/* karaoke stage */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "10vh 20px 22vh",
        }}
      >
        <div style={{ width: "min(760px, 100%)", maxWidth: "100%", margin: "0 auto" }}>
          <div
            className="accent"
            style={{ fontSize: 26, fontWeight: 700, marginBottom: 18, letterSpacing: "0.02em" }}
            aria-hidden="true"
          >
            {wordNo || 0}
          </div>
          {!ready ? (
            <p className="dim">loading…</p>
          ) : (
            <div
              className="k-text"
              style={{
                fontSize: "clamp(16px, 2.5vw, 29px)",
                lineHeight: 1.85,
                fontWeight: 500,
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              {kara.paras.map((row, pi) => (
                <p key={pi} style={{ margin: "0 0 1.1em" }}>
                  {row.map(renderWord)}
                </p>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* transport */}
      <footer
        style={{
          borderTop: "1px solid var(--sub-alt)",
          padding: "12px 20px calc(12px + env(safe-area-inset-bottom))",
          background: "var(--bg)",
          position: "sticky",
          bottom: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={toggle}
            className="focus-ring"
            aria-label={playing ? "Pause" : "Play"}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "var(--main)",
              color: "var(--bg)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M8 5l11 7-11 7z" />
              </svg>
            )}
          </button>

          <span className="dim" style={{ fontSize: 12, width: 40, textAlign: "right" }}>{mmss(cur)}</span>

          {/* seek bar */}
          <div
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - r.left) / r.width) * dur);
            }}
            style={{ flex: 1, minWidth: 0, height: 18, display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <div style={{ position: "relative", width: "100%", height: 4, background: "var(--sub-alt)", borderRadius: 999 }}>
              <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "var(--main)", borderRadius: 999 }} />
              <div
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: "50%",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "var(--main)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          </div>

          <span className="dim" style={{ fontSize: 12, width: 40 }}>{mmss(dur)}</span>

          <button
            onClick={() => applyRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
            className="focus-ring"
            aria-label="Playback speed"
            title="Playback speed"
            style={{ color: "var(--sub)", fontSize: 13, fontWeight: 700, width: 44, textAlign: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--main)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sub)")}
          >
            {rate}x
          </button>
        </div>
      </footer>

      <audio
        ref={audioRef}
        src={book.has_audio ? `/audio/${book.id}.mp3` : undefined}
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDur((prev) => (isFinite(d) && d > 0 ? d : prev));
        }}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <style>{`
        .k-word { transition: color .12s ease; }
        .k-text .k-word:hover { color: var(--main) !important; }
        .k-caret {
          position: absolute;
          left: -0.09em;
          top: 0.08em;
          width: 0.09em;
          height: 1.15em;
          background: var(--main);
          border-radius: 2px;
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}
