import { describe, it, expect } from "vitest";
import { parseGuideBody, deriveExcerpt, estimateReadingTimeMinutes } from "./guideContent";

describe("parseGuideBody", () => {
  it("splits blank-line-separated blocks into paragraph/heading/list types", () => {
    const body = "Intro paragraph.\n\n## Section heading\n\n- First point\n- Second point\n\nClosing paragraph.";
    const blocks = parseGuideBody(body);
    expect(blocks).toEqual([
      { type: "paragraph", text: "Intro paragraph." },
      { type: "heading", text: "Section heading" },
      { type: "list", items: ["First point", "Second point"] },
      { type: "paragraph", text: "Closing paragraph." },
    ]);
  });

  it("joins multi-line paragraphs onto a single line", () => {
    const blocks = parseGuideBody("Line one\nline two\nline three");
    expect(blocks).toEqual([{ type: "paragraph", text: "Line one line two line three" }]);
  });

  it("does not treat a block as a list unless every line starts with '- '", () => {
    const blocks = parseGuideBody("- one\nnot a bullet\n- three");
    expect(blocks).toEqual([{ type: "paragraph", text: "- one not a bullet - three" }]);
  });

  it("returns an empty array for empty/whitespace-only body, never throwing", () => {
    expect(parseGuideBody("")).toEqual([]);
    expect(parseGuideBody("   \n\n   ")).toEqual([]);
  });
});

describe("deriveExcerpt", () => {
  it("uses the first paragraph, skipping a leading heading", () => {
    const body = "## Overview\n\nThis is the real first paragraph that should become the excerpt.";
    expect(deriveExcerpt(body)).toBe("This is the real first paragraph that should become the excerpt.");
  });

  it("truncates a long paragraph at a word boundary with an ellipsis", () => {
    const longText = "word ".repeat(50).trim();
    const excerpt = deriveExcerpt(longText, 40);
    expect(excerpt.length).toBeLessThanOrEqual(41); // 40 + ellipsis char
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.endsWith(" …")).toBe(false); // no dangling space before the ellipsis
  });

  it("returns an empty string for a body with no paragraph (e.g. only a heading)", () => {
    expect(deriveExcerpt("## Just a heading")).toBe("");
  });
});

describe("estimateReadingTimeMinutes", () => {
  it("rounds to the nearest minute at 200wpm", () => {
    const words400 = "word ".repeat(400).trim();
    expect(estimateReadingTimeMinutes(words400)).toBe(2);
  });

  it("never returns less than 1 minute, even for very short content", () => {
    expect(estimateReadingTimeMinutes("Short.")).toBe(1);
    expect(estimateReadingTimeMinutes("")).toBe(1);
  });
});
