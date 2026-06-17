// Normalized contribution data used across the app (server fetch -> DB -> client render).

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  /** GitHub's day bucket (YYYY-MM-DD). We keep GitHub's own date/weekday as-is. */
  date: string;
  /** contributionCount for the day. */
  count: number;
  /** Mapped from GitHub's contributionLevel enum (NONE..FOURTH_QUARTILE). */
  level: ContributionLevel;
  /** 0 = Sunday ... 6 = Saturday (GitHub's assignment; used for grid row). */
  weekday: number;
  /** GitHub's suggested cell color (kept for reference; art uses palettes). */
  color: string;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionData {
  login: string;
  name: string | null;
  avatarUrl: string;
  totalContributions: number;
  /** ~52-54 Sunday-aligned weeks. Never assume exactly 53. */
  weeks: ContributionWeek[];
  /** Requested window start (ISO, +09:00). */
  from: string;
  /** Requested window end (ISO, +09:00). */
  to: string;
  /** Instant the data was fetched (ISO). Rendered as "最終更新" in JST. */
  fetchedAt: string;
}
