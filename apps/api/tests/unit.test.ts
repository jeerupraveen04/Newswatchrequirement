import { describe, it, expect } from "vitest";
import { slugify, wordCount, readingMinutes } from "../src/utils/text";
import { sanitizeRichText } from "../src/services/article.service";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
  it("strips accents", () => {
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --News--  ")).toBe("news");
  });
});

describe("wordCount / readingMinutes", () => {
  it("counts words ignoring tags", () => {
    expect(wordCount("<p>one two three</p>")).toBe(3);
  });
  it("returns at least one minute", () => {
    expect(readingMinutes("<p>short</p>")).toBe(1);
  });
});

describe("sanitizeRichText (REQ-REP-085)", () => {
  it("allows whitelisted tags", () => {
    expect(sanitizeRichText("<p>hi <strong>there</strong></p>")).toContain("<strong>");
  });
  it("strips script tags", () => {
    const out = sanitizeRichText('<p>x</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
  });
  it("strips event handlers", () => {
    const out = sanitizeRichText('<p onclick="evil()">x</p>');
    expect(out).not.toContain("onclick");
  });
  it("strips javascript: URLs", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });
  it("keeps allowed inline colour styles", () => {
    const out = sanitizeRichText('<span style="color:#8a007a">x</span>');
    expect(out).toContain("color:#8a007a");
  });
});
