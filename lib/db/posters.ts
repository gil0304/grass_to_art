import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContributionData } from "@/lib/github/types";
import type { PosterConfig } from "@/lib/poster/config";

// --- Contribution snapshots -------------------------------------------------
// We persist the fetched contribution data so the editor survives page reloads
// and the loss of `provider_token` (which is only available right after OAuth).

export async function saveSnapshot(userId: string, data: ContributionData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contribution_snapshots").upsert(
    {
      user_id: userId,
      github_login: data.login,
      from_date: data.from,
      to_date: data.to,
      total: data.totalContributions,
      data,
      fetched_at: data.fetchedAt,
    },
    { onConflict: "user_id,github_login,from_date,to_date" },
  );
  if (error) throw new Error(`saveSnapshot: ${error.message}`);
}

export async function latestSnapshot(userId: string): Promise<ContributionData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contribution_snapshots")
    .select("data")
    .eq("user_id", userId)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`latestSnapshot: ${error.message}`);
  return (data?.data as ContributionData) ?? null;
}

// --- Saved posters (optional "my works" feature) ----------------------------

export interface SavedPoster {
  id: string;
  github_login: string;
  from_date: string;
  to_date: string;
  style: string;
  config: PosterConfig;
  created_at: string;
}

export async function savePoster(
  userId: string,
  data: ContributionData,
  config: PosterConfig,
): Promise<string> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("posters")
    .insert({
      user_id: userId,
      github_login: data.login,
      from_date: data.from,
      to_date: data.to,
      style: config.style,
      config,
    })
    .select("id")
    .single();
  if (error) throw new Error(`savePoster: ${error.message}`);
  return row.id as string;
}

export async function listPosters(userId: string): Promise<SavedPoster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posters")
    .select("id, github_login, from_date, to_date, style, config, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listPosters: ${error.message}`);
  return (data ?? []) as SavedPoster[];
}
