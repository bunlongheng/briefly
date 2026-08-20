// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import KaraokeText from "../components/KaraokeText";
import { buildKaraoke } from "../lib/karaoke";

afterEach(cleanup);

// Renders the real component and asserts the DOM reflects the karaoke state - this
// covers the UI layer (done/active/future coloring, the caret, the data-active
// hook the reader scrolls to), not just the pure sync math.
describe("<KaraokeText>", () => {
  const kara = buildKaraoke("be take now"); // "take" occupies chars 3..6

  it("marks exactly one word active and it carries the caret", () => {
    // activeChar = 4 -> inside "take" ('a'), so "take" is the active word
    render(<KaraokeText paras={kara.paras} activeChar={4} onSeekWord={() => {}} />);
    const active = document.querySelectorAll("[data-active]");
    expect(active).toHaveLength(1);
    expect(active[0].textContent?.trim()).toBe("take");
    // the caret element only exists inside the active word
    expect(document.querySelectorAll(".k-caret")).toHaveLength(1);
  });

  it("shows all words and no caret before playback starts", () => {
    render(<KaraokeText paras={kara.paras} activeChar={-1} onSeekWord={() => {}} />);
    expect(screen.getByText("be")).toBeTruthy();
    expect(document.querySelectorAll("[data-active]")).toHaveLength(0);
    expect(document.querySelectorAll(".k-caret")).toHaveLength(0);
  });

  it("has no active word once everything is spoken", () => {
    render(<KaraokeText paras={kara.paras} activeChar={999} onSeekWord={() => {}} />);
    expect(document.querySelectorAll("[data-active]")).toHaveLength(0);
  });

  it("seeks to the clicked word's first character index", () => {
    let seeked = -1;
    render(<KaraokeText paras={kara.paras} activeChar={0} onSeekWord={(ci) => (seeked = ci)} />);
    (screen.getByText("now") as HTMLElement).click();
    expect(seeked).toBe(8); // "now" starts at char index 8
  });
});
