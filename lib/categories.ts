// Static shelf map for the YT-Music-style home. Books are few and curated, so
// a hand map beats a schema migration; unknown ids land on the "more" shelf.
export const CATEGORY: Record<number, string> = {
  1: "fables",
  3: "about",
  4: "about",
  6: "persuasion",
  7: "habits",
  8: "money",
  9: "money",
  10: "habits",
  11: "money",
  12: "habits",
  13: "mindset",
  14: "relationships",
  15: "habits",
  16: "mindset",
  18: "money",
  19: "parenting",
  20: "parenting",
  21: "work",
  22: "work",
  23: "work",
  24: "persuasion",
  26: "persuasion",
  27: "work",
};

// Shelf render order - also the chip order after "all".
export const SHELVES = [
  "money",
  "habits",
  "work",
  "persuasion",
  "mindset",
  "parenting",
  "relationships",
  "fables",
  "about",
  "more",
];

export const catOf = (id: number): string => CATEGORY[id] || "more";
