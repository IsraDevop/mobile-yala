import type { LiveComment } from "../types";

// Merge incoming live-chat comments into the existing list, deduped by id and kept in ascending
// id order (comment ids are auto-incremented, so id order is chronological). This lets the chat
// pull from two sources at once — the STOMP subscription (instant) and a polling fallback — without
// duplicating messages or losing any if one source misses a frame.
export function mergeComments(prev: LiveComment[], incoming: LiveComment[]): LiveComment[] {
  if (!incoming || incoming.length === 0) return prev;
  const seen = new Set(prev.map((c) => c.id));
  const added = incoming.filter((c) => c != null && c.id != null && !seen.has(c.id));
  if (added.length === 0) return prev;
  return [...prev, ...added].sort((a, b) => Number(a.id) - Number(b.id));
}
