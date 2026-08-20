import { describe, it, expect } from "vitest";
import {
  buildKaraoke,
  charIndexAt,
  wordState,
  activeWordNumber,
} from "../lib/karaoke";

describe("buildKaraoke", () => {
  it("tokenizes words with correct global char offsets", () => {
    const body = "be take now";
    const k = buildKaraoke(body);
    expect(k.paras).toHaveLength(1);
    const [row] = k.paras;
    expect(row.map((t) => t.w)).toEqual(["be", "take", "now"]);
    // offsets point at the first char of each word in `body`
    expect(row.map((t) => t.ci)).toEqual([0, 3, 8]);
    expect(body.slice(3, 3 + 4)).toBe("take");
    expect(k.words).toBe(3);
    expect(k.chars).toBe(body.length);
  });

  it("splits paragraphs on blank lines and preserves offsets across them", () => {
    const body = "one two\n\nthree";
    const k = buildKaraoke(body);
    expect(k.paras).toHaveLength(2);
    expect(k.paras[1][0].w).toBe("three");
    // "three" starts at index 9 in the raw string
    expect(k.paras[1][0].ci).toBe(9);
    expect(body.slice(9, 14)).toBe("three");
  });

  it("handles empty input", () => {
    const k = buildKaraoke("");
    expect(k.paras).toEqual([]);
    expect(k.words).toBe(0);
  });
});

describe("charIndexAt", () => {
  const starts = [0, 1, 2, 3, 4]; // char i begins at second i

  it("returns -1 before the first character", () => {
    expect(charIndexAt(starts, -0.5)).toBe(-1);
  });

  it("finds the last character whose start <= t", () => {
    expect(charIndexAt(starts, 0)).toBe(0);
    expect(charIndexAt(starts, 2.4)).toBe(2);
    expect(charIndexAt(starts, 3.999)).toBe(3);
    expect(charIndexAt(starts, 100)).toBe(4);
  });

  it("is exact on boundaries", () => {
    expect(charIndexAt(starts, 4)).toBe(4);
    expect(charIndexAt(starts, 1)).toBe(1);
  });

  it("handles an empty timing array", () => {
    expect(charIndexAt([], 5)).toBe(-1);
  });
});

describe("wordState", () => {
  // body "be take" -> "take" starts at ci=3, length 4 (chars 3..6)
  const take = { w: "take", ci: 3 };

  it("is future before the word starts", () => {
    expect(wordState(take, 2)).toEqual({ state: "future", typed: 0 });
  });

  it("is active mid-word with the right typed count", () => {
    // activeChar=4 -> the 'a' (2nd char) is current
    expect(wordState(take, 4)).toEqual({ state: "active", typed: 2 });
  });

  it("is done once the last character is reached", () => {
    expect(wordState(take, 6)).toEqual({ state: "done", typed: 4 });
    expect(wordState(take, 99)).toEqual({ state: "done", typed: 4 });
  });
});

describe("activeWordNumber", () => {
  const k = buildKaraoke("be take now people");
  it("is 0 before anything is spoken", () => {
    expect(activeWordNumber(k, -1)).toBe(0);
  });
  it("counts up as the caret advances", () => {
    expect(activeWordNumber(k, 0)).toBe(1); // in "be"
    expect(activeWordNumber(k, 4)).toBe(2); // in "take"
    expect(activeWordNumber(k, 8)).toBe(3); // in "now"
  });
});
