/**
 * Cursor pagination helpers (REQ-SYS-460/461).
 * The cursor encodes the sort key tuple as base64 JSON; clients treat it as opaque.
 */

export interface CursorPayload {
  [key: string]: string | number | null;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodeCursor<T extends CursorPayload>(cursor: string): T {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    throw new Error("INVALID_CURSOR");
  }
}
