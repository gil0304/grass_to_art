// All date math/labels are anchored to Japan Standard Time (UTC+9).
// We never rely on the server's or browser's local timezone.

export const JST_TZ = "Asia/Tokyo";

/** YYYY-MM-DD in JST for a given instant (en-CA yields ISO-style date). */
export function jstDateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Human label like "2025年6月7日 14:32" in JST, for the "最終更新" line. */
export function jstDateTimeLabel(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * from/to for a JST calendar year. The +09:00 offset moves the *window edges*
 * to JST midnight; it does NOT re-bucket individual days (GitHub keeps its own
 * per-day assignment). That's the documented trade-off of "方針A".
 */
export function jstYearRange(year: number): { from: string; to: string } {
  return {
    from: `${year}-01-01T00:00:00+09:00`,
    to: `${year}-12-31T23:59:59+09:00`,
  };
}

/** Rolling last 365 days ending now, edges expressed in JST wall-clock (+09:00). */
export function jstRollingYearRange(now: Date = new Date()): { from: string; to: string } {
  const to = jstOffsetString(now);
  const from = jstOffsetString(new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000));
  return { from, to };
}

/** Express an instant as an ISO string with the JST wall-clock and +09:00 offset. */
function jstOffsetString(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hour = get("hour");
  if (hour === "24") hour = "00"; // some runtimes emit "24" at midnight
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}+09:00`;
}
