import { describe, expect, it } from "vitest";
import { cosine, pickHighlights, splitSentences } from "./sentences";

const slice = (text: string, spans: [number, number][]) =>
  spans.map(([s, e]) => text.slice(s, e));

describe("splitSentences", () => {
  it("splits on sentence punctuation and returns exact offsets", () => {
    const text = "The first sentence is here. The second one follows it! Is there really a third one?";
    expect(slice(text, splitSentences(text))).toEqual([
      "The first sentence is here.",
      "The second one follows it!",
      "Is there really a third one?",
    ]);
  });

  it("does not split numbers or file extensions", () => {
    const text = "Chunks are about 1,000 characters long with 1.5x overlap in .txt and .md files.";
    expect(splitSentences(text)).toHaveLength(1);
  });

  it("splits on line breaks", () => {
    const text = "First line of the list item\nSecond line of the list item";
    expect(slice(text, splitSentences(text))).toEqual([
      "First line of the list item",
      "Second line of the list item",
    ]);
  });

  it("drops Markdown headings", () => {
    const text = "# A heading that is long enough to count\n\nThe body sentence that matters here.";
    expect(slice(text, splitSentences(text))).toEqual(["The body sentence that matters here."]);
  });

  it("joins short fragments to the sentence that follows", () => {
    const text = "See fig. 2. The result was clearly significant in every trial.";
    expect(slice(text, splitSentences(text))).toEqual([
      "See fig. 2. The result was clearly significant in every trial.",
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   ")).toEqual([]);
  });
});

describe("cosine", () => {
  it("is 1 for identical direction and 0 for orthogonal vectors", () => {
    expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("does not return NaN for zero vectors", () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe("pickHighlights", () => {
  const spans: [number, number][] = [
    [0, 10],
    [11, 20],
    [21, 30],
  ];

  it("picks the best sentence", () => {
    expect(pickHighlights(spans, [0.5, 0.8, 0.6])).toEqual([[11, 20]]);
  });

  it("adds a runner-up only when it is nearly as good", () => {
    expect(pickHighlights(spans, [0.79, 0.8, 0.5])).toEqual([
      [0, 10],
      [11, 20],
    ]);
  });

  it("highlights nothing when no sentence is a clear match", () => {
    expect(pickHighlights(spans, [0.1, 0.2, 0.3])).toEqual([]);
  });

  it("handles a chunk without sentences", () => {
    expect(pickHighlights([], [])).toEqual([]);
  });
});
