export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function wordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(wordCount(html) / 200));
}
