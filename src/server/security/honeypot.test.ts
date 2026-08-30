import { describe, it, expect } from "vitest";
import { isHoneypotTriggered, honeypotFieldSchema, HONEYPOT_FIELD_NAME } from "@/server/security/honeypot";

describe("isHoneypotTriggered", () => {
  it("is false for an empty string (the legitimate, human-submitted case)", () => {
    expect(isHoneypotTriggered("")).toBe(false);
  });

  it("is true for any non-empty value", () => {
    expect(isHoneypotTriggered("http://spam.example")).toBe(true);
    expect(isHoneypotTriggered("x")).toBe(true);
  });
});

describe("honeypotFieldSchema", () => {
  it("defaults to an empty string when the field is entirely absent from the payload", () => {
    const parsed = honeypotFieldSchema.parse(undefined);
    expect(parsed).toBe("");
    expect(isHoneypotTriggered(parsed)).toBe(false);
  });

  it("trims whitespace, so whitespace-only bot input still parses to empty and isn't flagged as a distinguishable validation error", () => {
    // Deliberately permissive: this must never throw / produce a 400 that a
    // bot could use to learn which field mattered.
    const parsed = honeypotFieldSchema.parse("   ");
    expect(parsed).toBe("");
  });

  it("never throws for a long garbage string up to the max length — no distinguishable validation error", () => {
    const garbage = "x".repeat(500);
    expect(() => honeypotFieldSchema.parse(garbage)).not.toThrow();
    expect(isHoneypotTriggered(honeypotFieldSchema.parse(garbage))).toBe(true);
  });

  it("field name is a stable, exported constant both endpoints/forms share", () => {
    expect(HONEYPOT_FIELD_NAME).toBe("website");
  });
});
