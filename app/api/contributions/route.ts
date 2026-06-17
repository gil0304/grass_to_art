import { NextResponse } from "next/server";
import { fetchContributions } from "@/lib/github/contributions";
import { jstYearRange } from "@/lib/jst";

// Public-data mode (§10): fetch ANY user's public contributions using a
// server-side GitHub token (a classic PAT in GITHUB_PUBLIC_TOKEN). This keeps
// the token off the client and is separate from the OAuth `provider_token`
// flow used for the logged-in user's own (possibly private) data.
export async function POST(request: Request) {
  const token = process.env.GITHUB_PUBLIC_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_PUBLIC_TOKEN is not configured (public mode disabled)." },
      { status: 503 },
    );
  }

  let body: { login?: string; year?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const login = body.login?.trim();
  if (!login) {
    return NextResponse.json({ error: "`login` is required" }, { status: 400 });
  }

  try {
    const { from, to } = jstYearRange(body.year ?? new Date().getFullYear());
    const data = await fetchContributions({ token, from, to, login });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
