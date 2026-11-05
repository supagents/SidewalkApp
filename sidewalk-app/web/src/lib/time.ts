// Small relative-time formatter for "Last updated by X · 2h ago" — no
// date-fns/dayjs dependency in this codebase, so this stays local and
// minimal rather than pulling one in for a single use site.
export function formatRelativeTime(millis: number, now: number = Date.now()): string {
  const diffSeconds = Math.max(0, Math.round((now - millis) / 1000));
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.round(diffDays / 365);
  return `${diffYears}y ago`;
}
