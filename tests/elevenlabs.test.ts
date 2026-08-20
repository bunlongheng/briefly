import { describe, it, expect } from "vitest";
import { chunkText, estimateSeconds } from "../lib/elevenlabs";

describe("chunkText", () => {
  it("returns a single chunk when the text fits", () => {
    expect(chunkText("hello world", 100)).toEqual(["hello world"]);
  });

  it("never exceeds the max chunk size", () => {
    const text = ("word ".repeat(2000)).trim();
    const chunks = chunkText(text, 200);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(200);
  });

  it("reconstructs the original text exactly (no lost or duplicated chars)", () => {
    const text =
      "The quick brown fox. Jumps over the lazy dog! Again and again? Yes indeed. " +
      "A second sentence here, with commas; and semicolons too.".repeat(20);
    const chunks = chunkText(text, 180);
    expect(chunks.join("")).toBe(text);
  });

  it("does not split in the middle of a word", () => {
    const text = "supercalifragilistic ".repeat(50).trim();
    const chunks = chunkText(text, 100);
    // every chunk boundary should fall on whitespace, so no chunk starts or ends
    // by slicing through a token
    for (let i = 0; i < chunks.length - 1; i++) {
      const joinPoint = chunks[i].slice(-1) + chunks[i + 1].slice(0, 1);
      expect(/\S\S/.test(joinPoint) && !/\s/.test(joinPoint)).toBe(false);
    }
  });
});

describe("estimateSeconds", () => {
  it("scales with word count (~150 wpm)", () => {
    expect(estimateSeconds("")).toBe(0);
    expect(estimateSeconds("word ".repeat(150).trim())).toBe(60);
    expect(estimateSeconds("word ".repeat(75).trim())).toBe(30);
  });
});
