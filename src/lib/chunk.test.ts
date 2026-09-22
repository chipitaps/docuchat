import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns nothing for empty or whitespace-only input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("  \n\n \t ")).toEqual([]);
  });

  it("keeps short text as a single chunk", () => {
    expect(chunkText("Hello world.")).toEqual(["Hello world."]);
  });

  it("never exceeds the configured size", () => {
    const text = "The quick brown fox jumps over the lazy dog. ".repeat(200);
    const chunks = chunkText(text, 300, 50);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(300);
  });

  it("prefers paragraph boundaries", () => {
    const a = "A".repeat(700);
    const b = "B".repeat(700);
    const [first] = chunkText(`${a}\n\n${b}`, 1000, 100);
    expect(first).toBe(a);
  });

  it("overlaps consecutive chunks so context isn't cut mid-thought", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(words, 200, 60);
    for (let i = 1; i < chunks.length; i++) {
      const tail = chunks[i - 1].split(" ").slice(-2).join(" ");
      expect(chunks[i]).toContain(tail);
    }
  });

  it("covers the whole input and always terminates", () => {
    const text = "x".repeat(5000);
    const chunks = chunkText(text, 400, 100);
    expect(chunks.join("").length).toBeGreaterThanOrEqual(text.length);
  });

  it("rejects an overlap that would loop forever", () => {
    expect(() => chunkText("abc", 100, 100)).toThrow();
  });
});
