/**
 * Pure, framework-free helpers for Guide content — no server-only import,
 * so these can run in both the server-only catalogue module
 * (guideCatalogue.ts) and directly in the /guides/[slug] page component.
 *
 * DELIBERATE DESIGN DECISION (see Phase 13/14 of the Guide feature brief):
 * Guide.body is stored as plain text with a tiny, explicit convention —
 * blank-line-separated blocks, "## " for a subheading, "- " for a bullet
 * list item, everything else is a paragraph. This is NOT Markdown (no
 * bold/italic/links/inline formatting) and is NOT rendered via
 * dangerouslySetInnerHTML anywhere — every block is plain text passed
 * straight into JSX, so React escapes it automatically and there is no
 * XSS surface at all. A full Markdown parser or rich-text editor
 * dependency isn't justified for this — the visual hierarchy the guide
 * pages need (headings, checklists, paragraphs) is fully covered by these
 * three block types.
 */

export type GuideContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export function parseGuideBody(body: string): GuideContentBlock[] {
  const blocks = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block): GuideContentBlock => {
    if (block.startsWith("## ")) {
      return { type: "heading", text: block.slice(3).trim() };
    }
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
      return { type: "list", items: lines.map((l) => l.slice(2).trim()) };
    }
    return { type: "paragraph", text: lines.join(" ") };
  });
}

/**
 * First real paragraph of the body, trimmed to a card-friendly length.
 * Skips leading headings so a guide that opens with "## Overview" still
 * gets a meaningful excerpt rather than just "Overview".
 */
export function deriveExcerpt(body: string, maxLength = 160): string {
  const blocks = parseGuideBody(body);
  const firstParagraph = blocks.find((b) => b.type === "paragraph");
  const text = firstParagraph && firstParagraph.type === "paragraph" ? firstParagraph.text : "";

  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

const WORDS_PER_MINUTE = 200;

export function estimateReadingTimeMinutes(body: string): number {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
