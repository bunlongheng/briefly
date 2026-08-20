"use client";

import { memo } from "react";
import type { Tok } from "@/lib/karaoke";
import { wordState } from "@/lib/karaoke";

// The reader ticks the active character ~10-15x/sec. Re-rendering every word in
// a long book on each tick is wasteful, so the text is split per paragraph and
// each paragraph is memoized: a paragraph only re-renders when ITS active state
// changes. We pass a per-paragraph `pActive`:
//   -1                 -> not started (all words dim)
//   MAX_SAFE_INTEGER   -> fully spoken (all words bright)
//   in-range index     -> the one active paragraph (re-renders as the caret moves)
// so every non-active paragraph receives stable props and React.memo skips it.

const DONE = Number.MAX_SAFE_INTEGER;

const Para = memo(function Para({
  row,
  pActive,
  onSeekWord,
}: {
  row: Tok[];
  pActive: number;
  onSeekWord: (ci: number) => void;
}) {
  return (
    <p style={{ margin: "0 0 1.1em" }}>
      {row.map((tok) => {
        const { state, typed } = wordState(tok, pActive);
        const isActive = state === "active";
        const color = state === "future" ? "var(--sub)" : "var(--text)";
        return (
          <span
            key={tok.ci}
            data-active={isActive ? "1" : undefined}
            onClick={() => onSeekWord(tok.ci)}
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
                          color: isCurrent
                            ? "var(--error)"
                            : spoken
                              ? "var(--text)"
                              : "var(--sub)",
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
      })}
    </p>
  );
});

function KaraokeText({
  paras,
  activeChar,
  onSeekWord,
}: {
  paras: Tok[][];
  activeChar: number;
  onSeekWord: (ci: number) => void;
}) {
  return (
    <>
      {paras.map((row, pi) => {
        const startCi = row[0].ci;
        const last = row[row.length - 1];
        const endCi = last.ci + last.w.length - 1;
        const pActive = activeChar >= endCi ? DONE : activeChar < startCi ? -1 : activeChar;
        return <Para key={pi} row={row} pActive={pActive} onSeekWord={onSeekWord} />;
      })}
    </>
  );
}

export default memo(KaraokeText);
