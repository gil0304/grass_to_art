import "server-only";
import type { ContributionData, ContributionDay } from "./types";
import { levelFromEnum } from "@/lib/contributions/levels";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

// contributionLevel + color let us match GitHub's own 5-level shading directly.
const CALENDAR_FIELDS = `
  contributionsCollection(from: $from, to: $to) {
    contributionCalendar {
      totalContributions
      weeks {
        contributionDays {
          contributionCount
          contributionLevel
          date
          weekday
          color
        }
      }
    }
  }
`;

// For the logged-in user, `viewer` avoids passing a login and can include
// private contributions when the token is scoped for it.
const VIEWER_QUERY = `
  query($from: DateTime!, $to: DateTime!) {
    viewer { name login avatarUrl ${CALENDAR_FIELDS} }
  }
`;

// For the "someone else's public data" mode (§10).
const USER_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) { name login avatarUrl ${CALENDAR_FIELDS} }
  }
`;

interface RawDay {
  contributionCount: number;
  contributionLevel: string;
  date: string;
  weekday: number;
  color: string;
}

export interface FetchParams {
  token: string;
  from: string;
  to: string;
  /** Omit to query `viewer` (the authenticated user). */
  login?: string;
}

export async function fetchContributions({
  token,
  from,
  to,
  login,
}: FetchParams): Promise<ContributionData> {
  const query = login ? USER_QUERY : VIEWER_QUERY;
  const variables = login ? { login, from, to } : { from, to };

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: { viewer?: RawNode; user?: RawNode | null };
    errors?: { message: string }[];
  };

  // GraphQL returns HTTP 200 even on query errors — always check `errors`.
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  }

  const node = login ? json.data?.user : json.data?.viewer;
  if (!node) {
    throw new Error(login ? `GitHub user not found: ${login}` : "Viewer not available");
  }

  const calendar = node.contributionsCollection.contributionCalendar;
  const weeks = calendar.weeks.map((w) => ({
    days: w.contributionDays.map(
      (d): ContributionDay => ({
        date: d.date,
        count: d.contributionCount,
        level: levelFromEnum(d.contributionLevel),
        weekday: d.weekday,
        color: d.color,
      }),
    ),
  }));

  return {
    login: node.login,
    name: node.name ?? null,
    avatarUrl: node.avatarUrl,
    totalContributions: calendar.totalContributions,
    weeks,
    from,
    to,
    fetchedAt: new Date().toISOString(),
  };
}

interface RawNode {
  name: string | null;
  login: string;
  avatarUrl: string;
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: RawDay[] }[];
    };
  };
}
