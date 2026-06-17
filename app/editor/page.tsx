import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { latestSnapshot } from "@/lib/db/posters";
import { mockContributions } from "@/lib/contributions/mock";
import { EditorClient } from "./EditorClient";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;

  // Demo mode and "Supabase not configured" both fall back to mock data so the
  // app is fully runnable (and the art/export is testable) without auth.
  if (sp.demo) {
    return <EditorClient data={mockContributions()} demo />;
  }
  if (!isSupabaseConfigured()) {
    return <EditorClient data={mockContributions()} notConfigured />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const snapshot = await latestSnapshot(user.id);
  if (!snapshot) {
    // Logged in but the fetch failed or returned nothing — show demo + a refetch CTA.
    const login = (user.user_metadata?.user_name as string | undefined) ?? "you";
    return <EditorClient data={mockContributions({ login })} needsFetch />;
  }
  return <EditorClient data={snapshot} />;
}
