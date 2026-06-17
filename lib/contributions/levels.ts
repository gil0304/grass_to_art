import type { ContributionLevel } from "@/lib/github/types";

// GitHub exposes the same 5 levels it uses on the profile graph via
// `contributionLevel`. We use it directly so our shading matches GitHub
// instead of re-deriving quartiles ourselves.
const LEVEL_MAP: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export function levelFromEnum(value: string): ContributionLevel {
  return LEVEL_MAP[value] ?? 0;
}
