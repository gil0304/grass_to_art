// Shared font fetching/caching used by both export paths:
// - SVG export embeds the font as a base64 @font-face (portable file)
// - PDF export outlines text using the same font (see outlineText.ts)

const bufferCache = new Map<string, Promise<ArrayBuffer>>();

export function fetchFontBuffer(url: string): Promise<ArrayBuffer> {
  let p = bufferCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`font fetch ${r.status}`);
      return r.arrayBuffer();
    });
    bufferCache.set(url, p);
  }
  return p;
}

function detectMime(buf: ArrayBuffer): string {
  const tag = String.fromCharCode(...new Uint8Array(buf, 0, 4));
  if (tag === "wOFF") return "font/woff";
  if (tag === "wOF2") return "font/woff2";
  if (tag === "OTTO") return "font/otf";
  return "font/ttf";
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** data: URL for embedding the font into an exported SVG via @font-face. */
export async function fontDataUrl(url: string): Promise<string> {
  const buf = await fetchFontBuffer(url);
  return `data:${detectMime(buf)};base64,${toBase64(buf)}`;
}
