import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchContributions } from "@/lib/github/contributions";
import { saveSnapshot } from "@/lib/db/posters";
import { jstYearRange } from "@/lib/jst";

// OAuth callback. We exchange the code for a session ON THE SERVER, which is the
// only place/time `provider_token` (the GitHub token) is available. We use it
// immediately to fetch contributions and persist a snapshot, then discard it —
// the browser never sees the GitHub token.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/editor";
  const yearParam = searchParams.get("year");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorDescription)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await createClient();
  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !exchanged.session) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error?.message ?? "auth_failed")}`,
    );
  }

  const providerToken = exchanged.session.provider_token;
  const userId = exchanged.session.user.id;

  if (providerToken) {
    try {
      const year = yearParam ? Number(yearParam) : new Date().getFullYear();
      const { from, to } = jstYearRange(year);
      const data = await fetchContributions({ token: providerToken, from, to });
      await saveSnapshot(userId, data);
    } catch (e) {
      // Never block login on a fetch/persist failure — the editor shows a refetch CTA.
      console.error("[auth/callback] contribution fetch failed:", e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
