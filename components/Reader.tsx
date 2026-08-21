"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlignFile, Book } from "@/lib/types";
import { mmss } from "@/lib/types";
import { activeWordNumber, buildKaraoke, charIndexAt } from "@/lib/karaoke";
import KaraokeText from "@/components/KaraokeText";

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
  const [copied, setCopied] = useState(false);

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

  // Autoplay on open - the tap that opened the reader is the user gesture, so
  // browsers allow it (iOS is best-effort; the play button remains as fallback).
  const autoplayed = useRef(false);
  useEffect(() => {
    if (autoplayed.current || !ready || !book.has_audio) return;
    autoplayed.current = true;
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
  }, [ready, book.has_audio]);

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

  // keep the active line centered - target the memoized word via a data attribute
  // so the scroll logic stays decoupled from the render tree
  const stageRef = useRef<HTMLDivElement>(null);
  const wordNo = activeWordNumber(kara, activeChar);
  useEffect(() => {
    stageRef.current
      ?.querySelector("[data-active]")
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [wordNo]);

  // share the clean per-book URL - its OG card shows the cover (story-time style)
  const share = useCallback(async () => {
    const url = `${window.location.origin}/b/${book.id}`;
    const data = {
      title: book.title,
      text: `${book.title}${book.author ? ` by ${book.author}` : ""} - listen on Briefly`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      return; // user cancelled the native sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked - nothing to do */
    }
  }, [book.id, book.title, book.author]);

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
          padding: "calc(14px + env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 14px max(20px, env(safe-area-inset-left))",
          borderBottom: "1px solid var(--sub-alt)",
          background: "var(--bg)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          className="back-btn focus-ring"
          aria-label="Back to library"
          title="Back"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
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
        <button
          onClick={share}
          className="back-btn focus-ring"
          aria-label="Share this book"
          title={copied ? "Link copied" : "Share"}
          style={{ position: "relative" }}
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          {copied && (
            <span
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                padding: "5px 9px",
                borderRadius: 7,
                background: "var(--main)",
                color: "var(--bg)",
              }}
            >
              link copied
            </span>
          )}
        </button>
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
        <div
          ref={stageRef}
          style={{ width: "min(760px, 100%)", maxWidth: "100%", margin: "0 auto" }}
        >
          {!ready ? (
            <p className="dim">loading…</p>
          ) : kara.paras.length === 0 ? (
            <p className="dim">no text.</p>
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
              <KaraokeText paras={kara.paras} activeChar={activeChar} onSeekWord={seekWord} />
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={() => seekTo((audioRef.current?.currentTime || 0) - 10)}
            className="skip-btn focus-ring"
            aria-label="Back 10 seconds"
            title="Back 10s"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 8L6 12l5 4V8zM18 8l-5 4 5 4V8z" fill="currentColor" stroke="none" />
            </svg>
            <span className="skip-num">10</span>
          </button>

          <button
            onClick={toggle}
            className="focus-ring"
            aria-label={playing ? "Pause" : "Play"}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "var(--main)",
              color: "var(--bg)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
                <path d="M8 5l11 7-11 7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => seekTo((audioRef.current?.currentTime || 0) + 10)}
            className="skip-btn focus-ring"
            aria-label="Forward 10 seconds"
            title="Forward 10s"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 8l5 4-5 4V8zM6 8l5 4-5 4V8z" fill="currentColor" stroke="none" />
            </svg>
            <span className="skip-num">10</span>
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
        .back-btn {
          width: 44px; height: 44px;
          border-radius: 999px;
          display: grid; place-items: center;
          flex-shrink: 0;
          color: var(--text);
          background: var(--card-hi);
          border: 1px solid var(--sub-alt);
          transition: background .15s ease, color .15s ease, border-color .15s ease, transform .1s ease;
        }
        .back-btn:hover { color: var(--main); border-color: var(--main); }
        .back-btn:active { transform: scale(0.94); }
        .skip-btn {
          position: relative;
          width: 40px; height: 40px;
          display: grid; place-items: center;
          color: var(--sub); flex-shrink: 0;
          transition: color .15s ease;
        }
        .skip-btn:hover { color: var(--main); }
        .skip-btn .skip-num {
          position: absolute; bottom: 3px; left: 0; right: 0;
          text-align: center; font-size: 8px; font-weight: 700;
          pointer-events: none;
        }
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
