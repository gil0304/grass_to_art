import type {
  ContributionData,
  ContributionDay,
  ContributionLevel,
} from "@/lib/github/types";
import { mulberry32 } from "@/lib/poster/rng";

// A deterministic, plausible year of contributions so the editor, preview and
// export all work without authentication (demo mode + local dev).
export function mockContributions(opts?: {
  login?: string;
  year?: number;
  seed?: number;
}): ContributionData {
  const login = opts?.login ?? "octocat";
  const year = opts?.year ?? 2025;
  const rng = mulberry32(opts?.seed ?? 20250101);

  // Start on the Sunday on/before Jan 1, then build 53 Sunday-aligned weeks.
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const cursor = new Date(jan1);
  cursor.setUTCDate(jan1.getUTCDate() - jan1.getUTCDay());

  const weeks: ContributionData["weeks"] = [];
  let total = 0;

  for (let w = 0; w < 53; w++) {
    const days: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const seasonal = 0.5 + 0.5 * Math.sin((w / 53) * Math.PI * 2);
      const weekend = d === 0 || d === 6 ? 0.4 : 1;
      const r = rng();
      const intensity = seasonal * weekend * r;
      const count = intensity < 0.25 ? 0 : Math.round(intensity * 18 * r);
      total += count;
      days.push({
        date: cursor.toISOString().slice(0, 10),
        count,
        level: countToLevel(count),
        weekday: d,
        color: "#216e39",
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push({ days });
  }

  return {
    login,
    name: "The Octocat",
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    totalContributions: total,
    weeks,
    from: `${year}-01-01T00:00:00+09:00`,
    to: `${year}-12-31T23:59:59+09:00`,
    fetchedAt: new Date().toISOString(),
  };
}

function countToLevel(count: number): ContributionLevel {
  if (count <= 0) return 0;
  if (count < 4) return 1;
  if (count < 8) return 2;
  if (count < 13) return 3;
  return 4;
}
