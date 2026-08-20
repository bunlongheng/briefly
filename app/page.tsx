"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/types";
import Menu from "@/components/Menu";
import Reader from "@/components/Reader";
import AddBook from "@/components/AddBook";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Book | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [adding, setAdding] = useState(false);
  // true only when the writable local API served the data - the static public
  // deploy reads books.json, where add/delete would just 401. Gates the UI.
  const [canManage, setCanManage] = useState(false);
  const [theme, toggleTheme] = useTheme();

  const load = useCallback(async () => {
    // Live DB when running locally; static manifest on serverless (Vercel).
    // Only PREFER the live API when it returns books - on Vercel the API has no
    // writable DB and returns [] (or errors), so we must fall through to the
    // committed manifest instead of showing an empty library.
    let manifest: Book[] = [];
    for (const url of ["/api/books", "/books.json"]) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const d = (await r.json()) as Book[];
        if (Array.isArray(d)) {
          if (d.length) {
            setBooks(d);
            setCanManage(url === "/api/books");
            setLoading(false);
            return;
          }
          if (url === "/books.json") manifest = d;
        }
      } catch {
        /* try next source */
      }
    }
    setBooks(manifest);
    setLoading(false);
  }, []);

  const onDelete = useCallback(
    async (id: number) => {
      try {
        const r = await fetch(`/api/books/${id}`, { method: "DELETE" });
        if (r.ok) await load();
      } catch {
        /* ignore - stays on the list */
      }
    },
    [load],
  );

  useEffect(() => {
    load();
  }, [load]);

  // deep link: /?b=<id>[&t=<seconds>] opens straight into a book (shareable)
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || loading) return;
    const q = new URLSearchParams(window.location.search);
    const id = q.get("b");
    if (!id) return;
    deepLinked.current = true;
    const b = books.find((x) => String(x.id) === id);
    const t = Number(q.get("t")) || 0;
    if (b) {
      setStartAt(t);
      setOpen(b);
    }
  }, [books, loading]);

  const onAdded = useCallback(
    async (id: number) => {
      setAdding(false);
      await load();
      try {
        const r = await fetch(`/api/books/${id}`, { cache: "no-store" });
        if (r.ok) setOpen((await r.json()) as Book);
      } catch {
        /* stay on menu if fetch fails */
      }
    },
    [load],
  );

  if (open)
    return (
      <Reader
        book={open}
        startAt={startAt}
        onBack={() => {
          setStartAt(0);
          setOpen(null);
        }}
      />
    );

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "calc(16px + env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) 16px max(22px, env(safe-area-inset-left))",
          maxWidth: 1040,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontWeight: 800, fontSize: 20 }}>
          <span className="accent">{">"}</span>
          <span>briefly</span>
          <span className="accent" style={{ animation: "blink 1.1s step-end infinite" }}>
            _
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setAdding(true)}
            className="focus-ring"
            style={{
              color: "var(--sub)",
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--sub-alt)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--main)";
              e.currentTarget.style.borderColor = "var(--main)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--sub)";
              e.currentTarget.style.borderColor = "var(--sub-alt)";
            }}
          >
            + add
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main style={{ flex: 1, padding: "10px 22px 60px", width: "100%" }}>
        <Menu
          books={books}
          loading={loading}
          onOpen={setOpen}
          onAdd={() => setAdding(true)}
          onDelete={canManage ? onDelete : undefined}
        />
      </main>

      {adding && <AddBook onClose={() => setAdding(false)} onAdded={onAdded} />}
    </div>
  );
}
