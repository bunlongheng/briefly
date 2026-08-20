import { describe, it, expect } from "vitest";
import { buildKaraoke, charIndexAt, activeWordNumber, wordState } from "../lib/karaoke";

// End-to-end simulation of how the Reader drives the highlight: build tokens from
// the aligned text, then step playback time forward and assert the active word /
// caret behave monotonically and land on the right characters - the exact
// integration of buildKaraoke + charIndexAt + activeWordNumber + wordState.
describe("reader playback simulation", () => {
  const text = "be take now people";
  // synthetic per-character start times: char i begins at i * 0.1s
  const starts = [...text].map((_, i) => i * 0.1);
  const kara = buildKaraoke(text);

  it("active word only ever moves forward as time advances", () => {
    let prev = 0;
    for (let t = 0; t <= text.length * 0.1 + 0.5; t += 0.05) {
      const ci = charIndexAt(starts, t);
      const n = activeWordNumber(kara, ci);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
    // by the end, all 4 words have been spoken
    expect(prev).toBe(4);
  });

  it("caret lands on the correct character inside the active word", () => {
    // 'take' occupies indices 3..6 ("t"=3,"a"=4,"k"=5,"e"=6)
    const take = kara.paras[0][1];
    expect(take.w).toBe("take");
    // at t=0.45s the active char is index 4 ('a') -> 2nd char of "take"
    const ci = charIndexAt(starts, 0.45);
    expect(ci).toBe(4);
    expect(text[ci]).toBe("a");
    expect(wordState(take, ci)).toEqual({ state: "active", typed: 2 });
  });

  it("every word is 'done' once playback passes its end", () => {
    const end = charIndexAt(starts, 999);
    for (const tok of kara.paras[0]) {
      expect(wordState(tok, end).state).toBe("done");
    }
  });

  it("nothing is highlighted before the first character starts", () => {
    const ci = charIndexAt(starts, -1);
    expect(ci).toBe(-1);
    expect(activeWordNumber(kara, ci)).toBe(0);
    expect(wordState(kara.paras[0][0], ci).state).toBe("future");
  });
});
