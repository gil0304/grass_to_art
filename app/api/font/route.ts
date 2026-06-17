import { NextResponse } from "next/server";

// Google Fonts proxy that returns a TTF. opentype.js (used for PDF outlining)
// can't parse woff2, and Google serves woff2 to modern browsers. An old WebKit
// (pre-woff2) User-Agent makes Google serve plain truetype instead — newer
// "compatibility" UAs like old IE would yield EOT, which we can't use.
const OLD_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) " +
  "AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

async function findFontFile(cssUrl: string): Promise<string | null> {
  const res = await fetch(cssUrl, { headers: { "User-Agent": OLD_UA } });
  if (!res.ok) return null;
  const css = await res.text();
  const m = css.match(/url\((https:\/\/[^)]+?\.(?:ttf|otf))\)/i);
  return m ? m[1] : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const family = searchParams.get("family")?.trim();
  const weight = (searchParams.get("weight") ?? "700").trim();
  if (!family) {
    return NextResponse.json({ error: "`family` is required" }, { status: 400 });
  }

  const fam = family.replace(/\s+/g, "+");
  const enc = encodeURIComponent(family);
  // Try the requested weight first, then fall back to the default weight
  // (single-weight fonts like Pacifico have no 700 and would 400 otherwise).
  const candidates = [
    `https://fonts.googleapis.com/css?family=${fam}:${weight}`,
    `https://fonts.googleapis.com/css2?family=${enc}:wght@${weight}`,
    `https://fonts.googleapis.com/css?family=${fam}`,
    `https://fonts.googleapis.com/css2?family=${enc}`,
  ];

  let fileUrl: string | null = null;
  for (const c of candidates) {
    try {
      fileUrl = await findFontFile(c);
    } catch {
      fileUrl = null;
    }
    if (fileUrl) break;
  }

  if (!fileUrl) {
    return NextResponse.json(
      { error: `Could not resolve a TTF for "${family}". Check the exact Google Fonts name.` },
      { status: 502 },
    );
  }

  const fontRes = await fetch(fileUrl);
  if (!fontRes.ok) {
    return NextResponse.json({ error: `font fetch ${fontRes.status}` }, { status: 502 });
  }
  const buf = await fontRes.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "font/ttf",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
