import * as opentype from "opentype.js";
import { fetchFontBuffer } from "./fontData";

// Converting <text> to vector <path> before SVG->PDF avoids the classic jsPDF
// problem where non-embedded fonts (esp. Japanese) render as tofu/blank, and
// lets the PDF match the chosen font.

const fontCache = new Map<string, Promise<opentype.Font | null>>();

async function loadFont(url?: string | null): Promise<opentype.Font | null> {
  if (!url) return null;
  let p = fontCache.get(url);
  if (!p) {
    p = fetchFontBuffer(url)
      .then((buf) => opentype.parse(buf))
      .catch((e) => {
        console.warn(`[outlineText] could not parse font (${url}).`, e);
        return null;
      });
    fontCache.set(url, p);
  }
  return p;
}

// Lay out a string glyph-by-glyph via the cmap (charToGlyph) instead of
// font.getPath(). This deliberately skips opentype.js's GSUB shaping, which
// throws on fonts with advanced substitutions (e.g. "lookupType 6 substFormat 2
// is not yet supported"). Poster titles don't need contextual shaping.
function glyphRunPath(font: opentype.Font, text: string, x: number, y: number, fontSize: number) {
  const scale = fontSize / (font.unitsPerEm || 1000);
  const path = new opentype.Path();
  let penX = x;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    if (!glyph) continue;
    path.extend(glyph.getPath(penX, y, fontSize));
    penX += (glyph.advanceWidth || 0) * scale;
  }
  return { path, width: penX - x };
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Replace every <text> in the SVG with outlined <path> nodes. No-op without a font. */
export async function outlineSvgText(svg: SVGSVGElement, fontUrl?: string | null): Promise<void> {
  const font = await loadFont(fontUrl);
  if (!font) return;

  for (const t of Array.from(svg.querySelectorAll("text"))) {
    const content = t.textContent ?? "";
    if (!content.trim()) {
      t.remove();
      continue;
    }
    try {
      const fontSize = parseFloat(attr(t, "font-size")) || 12;
      const fill = attr(t, "fill") || "#000";
      const anchor = attr(t, "text-anchor");
      let x = parseFloat(t.getAttribute("x") || "0");
      const y = parseFloat(t.getAttribute("y") || "0");
      if (anchor === "end" || anchor === "middle") {
        const { width } = glyphRunPath(font, content, 0, 0, fontSize);
        x -= anchor === "end" ? width : width / 2;
      }
      const { path: run } = glyphRunPath(font, content, x, y, fontSize);
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", run.toPathData(2));
      path.setAttribute("fill", fill);
      const opacity = t.getAttribute("opacity");
      if (opacity) path.setAttribute("opacity", opacity);
      t.replaceWith(path);
    } catch (e) {
      // Leave this text node as-is; svg2pdf will render it with a standard font.
      console.warn("[outlineText] could not outline a text node; leaving it as text.", e);
    }
  }
}

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? window.getComputedStyle(el).getPropertyValue(name);
}
