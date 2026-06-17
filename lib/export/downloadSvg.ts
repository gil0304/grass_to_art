import { fontDataUrl } from "./fontData";

// Export the live poster <svg> as a standalone SVG or a high-res PNG. When a
// custom/Google font is in use it's embedded as a base64 @font-face so the
// output renders correctly anywhere (and rasterizes with the right font).

const SVG_NS = "http://www.w3.org/2000/svg";

export interface ExportOptions {
  fontUrl?: string | null;
  fontFamily?: string;
}

async function buildSvgString(
  svg: SVGSVGElement,
  opts: ExportOptions,
  sizePx?: { w: number; h: number },
): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.removeAttribute("style"); // drop preview-only px sizing → keep the mm print size
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  if (sizePx) {
    clone.setAttribute("width", String(sizePx.w));
    clone.setAttribute("height", String(sizePx.h));
  }

  if (opts.fontUrl && opts.fontFamily) {
    try {
      const dataUrl = await fontDataUrl(opts.fontUrl);
      const style = document.createElementNS(SVG_NS, "style");
      style.textContent = `@font-face{font-family:'${cssEscape(opts.fontFamily)}';src:url(${dataUrl});}`;
      clone.insertBefore(style, clone.firstChild);
    } catch (e) {
      console.warn("[export] font embed failed; output references the family only.", e);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export async function exportSvg(svg: SVGSVGElement, filename: string, opts: ExportOptions = {}): Promise<void> {
  const s = await buildSvgString(svg, opts);
  triggerDownload(new Blob([s], { type: "image/svg+xml;charset=utf-8" }), filename);
}

export async function exportPng(svg: SVGSVGElement, filename: string, opts: ExportOptions = {}): Promise<void> {
  const vb = (svg.getAttribute("viewBox") || "0 0 297 420").split(/\s+/).map(Number);
  const wMm = vb[2] || 297;
  const hMm = vb[3] || 420;
  const pxPerMm = 300 / 25.4; // 300 DPI
  let cw = Math.round(wMm * pxPerMm);
  let ch = Math.round(hMm * pxPerMm);
  const MAX = 4096; // cap so very large papers don't blow up memory
  const cap = Math.max(cw, ch);
  if (cap > MAX) {
    const k = MAX / cap;
    cw = Math.round(cw * k);
    ch = Math.round(ch * k);
  }

  const svgString = await buildSvgString(svg, opts, { w: cw, h: ch });
  const url = URL.createObjectURL(new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG could not be rasterized"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0, cw, ch);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"),
    );
    triggerDownload(blob, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cssEscape(s: string): string {
  return s.replace(/['\\]/g, "\\$&");
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
