/**
 * Cursor pagination helpers (REQ-SYS-460/461).
 * The cursor encodes the sort key tuple as base64 JSON; clients treat it as
 * opaque. Uses base64url with no Node Buffer dependency so the same code runs
 * in browsers, React Native, and Node.
 */

export interface CursorPayload {
  [key: string]: string | number | null;
}

function toBase64(input: string): string {
  // Browser / React Native
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(input)));
  }
  // Node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B = (globalThis as any).Buffer;
  if (B) return B.from(input, "utf8").toString("base64");
  throw new Error("No base64 encoder available");
}

function fromBase64(input: string): string {
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(input)));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B = (globalThis as any).Buffer;
  if (B) return B.from(input, "base64").toString("utf8");
  throw new Error("No base64 decoder available");
}

export function encodeCursor(payload: CursorPayload): string {
  return toBase64(JSON.stringify(payload));
}

export function decodeCursor<T extends CursorPayload>(cursor: string): T {
  try {
    return JSON.parse(fromBase64(cursor)) as T;
  } catch {
    throw new Error("INVALID_CURSOR");
  }
}
