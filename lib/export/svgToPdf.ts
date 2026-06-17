import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { paperDims, type Orientation, type PaperId } from "@/lib/poster/config";
import { outlineSvgText } from "./outlineText";
import { triggerDownload } from "./downloadSvg";

export interface PdfOptions {
  paper: PaperId;
  orientation: Orientation;
  /** Optional font URL used to outline text (recommended for Japanese). */
  fontUrl?: string;
}

// Render the poster SVG to a print-sized, vector PDF (mm units, no rasterizing).
export async function exportPdf(
  svg: SVGSVGElement,
  filename: string,
  opts: PdfOptions,
): Promise<void> {
  const { w, h } = paperDims(opts.paper, opts.orientation);
  const doc = new jsPDF({ unit: "mm", format: [w, h], orientation: opts.orientation });

  // Work on an off-screen clone so the live preview is never mutated.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.style.position = "fixed";
  clone.style.left = "-99999px";
  clone.style.top = "0";
  document.body.appendChild(clone);
  try {
    await outlineSvgText(clone, opts.fontUrl);
    await svg2pdf(clone, doc, { x: 0, y: 0, width: w, height: h });
    triggerDownload(doc.output("blob"), filename);
  } finally {
    clone.remove();
  }
}
