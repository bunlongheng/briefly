"use client";

import { useEffect, useRef, useState } from "react";
import { VOICES } from "@/lib/voices";

// Paste text -> synthesize audio + alignment -> new book. Runs against the local
// API (POST /api/books). On read-only deploys the call fails gracefully.
export default function AddBook({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [voice, setVoice] = useState(VOICES[0].id);
  const [music, setMusic] = useState(true); // soft ambient bed under the voice
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const words = body.split(/\s+/).filter(Boolean).length;

  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          author: author.trim() || null,
          voice_id: voice,
          music,
          body: body.trim(),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      if (d?.warn) throw new Error(d.warn);
      onAdded(Number(d.id));
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  };

  const field: React.CSSProperties = {
    background: "var(--bg-deep)",
    border: "1px solid var(--sub-alt)",
    color: "var(--text)",
    fontFamily: "var(--mono)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "color-mix(in srgb, var(--bg-deep) 82%, transparent)",
        backdropFilter: "blur(3px)",
        display: "grid",
        placeItems: "center",
        padding: 18,
        zIndex: 50,
        animation: "rise .18s ease",
      }}
    >
      <div
        style={{
          width: "min(680px, 100%)",
          maxHeight: "92dvh",
          overflow: "auto",
          background: "var(--card)",
          border: "1px solid var(--sub-alt)",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 24px 60px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span className="accent" style={{ fontWeight: 700 }}>
            {">"}
          </span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>add a book</h2>
          <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>
            {words} words {words > 0 ? `· ~${Math.max(1, Math.round(words / 150))} min` : ""}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              style={field}
              placeholder="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              aria-label="Title"
            />
            <input
              style={field}
              placeholder="author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={busy}
              aria-label="Author"
            />
          </div>

          <select
            style={{ ...field, appearance: "none" }}
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={busy}
            aria-label="Narrator voice"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} - {v.desc}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--sub)",
              cursor: busy ? "default" : "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={music}
              onChange={(e) => setMusic(e.target.checked)}
              disabled={busy}
              style={{ accentColor: "var(--main)", width: 16, height: 16 }}
            />
            ambient bed - a soft, ducked soundtrack under the narration
          </label>

          <textarea
            ref={areaRef}
            style={{ ...field, minHeight: 220, resize: "vertical", lineHeight: 1.6 }}
            placeholder="paste your text here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
            aria-label="Text to read"
          />

          {err && (
            <p style={{ margin: 0, color: "var(--error)", fontSize: 13 }}>
              {err.length > 200 ? err.slice(0, 200) + "…" : err}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              onClick={() => !busy && onClose()}
              disabled={busy}
              className="focus-ring"
              style={{ color: "var(--sub)", padding: "10px 16px", fontSize: 14 }}
            >
              cancel
            </button>
            <button
              onClick={submit}
              disabled={busy || !body.trim()}
              className="focus-ring"
              style={{
                background: "var(--main)",
                color: "var(--bg)",
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 8,
                fontSize: 14,
                opacity: busy || !body.trim() ? 0.5 : 1,
              }}
            >
              {busy ? "narrating…" : "add + narrate"}
            </button>
          </div>
          {busy && (
            <p className="dim" style={{ margin: 0, fontSize: 12, textAlign: "right" }}>
              synthesizing voice + word timing, this can take a moment for long text
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
