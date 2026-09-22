import { describe, expect, it } from "vitest";
import { buildExcerpt, stripHeadings } from "./excerpt";

const words = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(" ");

describe("stripHeadings", () => {
  it("removes heading lines but keeps prose and inline #", () => {
    const text = "Intro sentence.\n\n## Ingestion\n\nSee issue #12 for details.";
    const result = stripHeadings(text);
    expect(result).not.toContain("Ingestion");
    expect(result).toContain("Intro sentence.");
    expect(result).toContain("issue #12");
  });

  it("leaves text without headings untouched", () => {
    expect(stripHeadings("Just a sentence.")).toBe("Just a sentence.");
  });
});

describe("buildExcerpt", () => {
  it("marks the highlighted range and keeps the text intact", () => {
    const content = "Before the match. The important sentence. After the match.";
    const start = content.indexOf("The important");
    const end = start + "The important sentence.".length;
    const { segments } = buildExcerpt(content, [[start, end]]);

    expect(segments.map((s) => s.text).join("")).toBe(content);
    expect(segments.filter((s) => s.marked).map((s) => s.text)).toEqual([
      "The important sentence.",
    ]);
  });

  it("shows a window around the highlight for long passages", () => {
    const content = `${words(80, "a")} TARGET sentence here. ${words(80, "b")}`;
    const start = content.indexOf("TARGET");
    const end = start + "TARGET sentence here.".length;
    const excerpt = buildExcerpt(content, [[start, end]], { radius: 60 });

    const shown = excerpt.segments.map((s) => s.text).join("");
    expect(excerpt.leading).toBe(true);
    expect(excerpt.trailing).toBe(true);
    expect(shown.length).toBeLessThan(content.length / 2);
    expect(shown).toContain("TARGET sentence here.");
  });

  it("cuts at word boundaries, never mid-word", () => {
    const content = `${words(80, "a")} TARGET sentence here. ${words(80, "b")}`;
    const start = content.indexOf("TARGET");
    const { segments } = buildExcerpt(content, [[start, start + 6]], { radius: 55 });
    const shown = segments.map((s) => s.text).join("");
    for (const token of shown.split(/\s+/)) expect(token).toMatch(/^([ab]\d+|TARGET|sentence|here\.)$/);
  });

  it("returns the whole passage when `full` is set", () => {
    const content = `${words(80, "a")} TARGET ${words(80, "b")}`;
    const start = content.indexOf("TARGET");
    const excerpt = buildExcerpt(content, [[start, start + 6]], { full: true });
    expect(excerpt.leading).toBe(false);
    expect(excerpt.trailing).toBe(false);
    expect(excerpt.segments.map((s) => s.text).join("")).toBe(content);
  });

  it("falls back to the start of the passage when nothing is highlighted", () => {
    const content = words(200, "w");
    const excerpt = buildExcerpt(content, []);
    expect(excerpt.leading).toBe(false);
    expect(excerpt.trailing).toBe(true);
    expect(excerpt.segments.every((s) => !s.marked)).toBe(true);
  });

  it("skips Markdown headings at the edges of the window", () => {
    const target = "TARGET sentence lives right here in the middle.";
    const content = `# Title\n\n## Ingestion\n\nWhen you upload a file the server extracts its text. ${target} Another sentence follows it here.\n\n## Retrieval`;
    const start = content.indexOf("TARGET");
    const { segments, leading, trailing } = buildExcerpt(content, [[start, start + target.length]]);

    expect(segments.map((s) => s.text).join("")).not.toContain("#");
    // Only headings were cut, so no ellipsis is needed.
    expect(leading).toBe(false);
    expect(trailing).toBe(false);
  });

  it("does not elide a few characters", () => {
    const content = "Short intro. The key sentence is right here. Short outro.";
    const start = content.indexOf("The key");
    const excerpt = buildExcerpt(content, [[start, start + 10]], { radius: 5 });
    expect(excerpt.leading).toBe(false);
    expect(excerpt.trailing).toBe(false);
  });
});
