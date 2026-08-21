"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/types";
import Menu from "@/components/Menu";
import Reader from "@/components/Reader";
import ThemeToggle, { useTheme } from "@/components/ThemeToggle";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Book | null>(null);
  const [startAt, setStartAt] = useState(0);
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

  // deep link: /b/<id> or /?b=<id>[&t=<seconds>] opens straight into a book
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || loading) return;
    const q = new URLSearchParams(window.location.search);
    const id = q.get("b") ?? window.location.pathname.match(/^\/b\/(\d+)/)?.[1] ?? null;
    if (!id) return;
    deepLinked.current = true;
    const b = books.find((x) => String(x.id) === id);
    const t = Number(q.get("t")) || 0;
    if (b) {
      setStartAt(t);
      setOpen(b);
    }
  }, [books, loading]);

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
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main style={{ flex: 1, padding: "10px 22px 60px", width: "100%" }}>
        <Menu
          books={books}
          loading={loading}
          onOpen={setOpen}
          onDelete={canManage ? onDelete : undefined}
        />
      </main>
    </div>
  );
}
