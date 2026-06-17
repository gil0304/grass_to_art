// Poster configuration: paper sizes (mm), palettes, fonts, and editable state.

export type StyleId = "city" | "organic" | "stars" | "geometric";
export type PaperId = "A4" | "A3" | "A2" | "card";
export type Orientation = "portrait" | "landscape";

export interface Palette {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  /** Colors for contribution levels 0..4. */
  levels: [string, string, string, string, string];
}

export interface PosterConfig {
  style: StyleId;
  /** Preset palette id, or "custom". */
  palette: string;
  /** Editable palette used when palette === "custom". */
  custom: Palette;
  /** Override background; null => palette.bg. */
  background: string | null;
  /** CSS font-family for poster text (a stack for presets, or a single family). */
  font: string;
  /** Parseable font file URL (ttf/otf) for @font-face + PDF outline + SVG embed.
   *  null => preset/system fonts (PDF falls back to /fonts/poster.ttf). */
  fontUrl: string | null;
  /** Font weight for the title. */
  fontWeight: number;
  /** IndexedDB key for an uploaded custom font (so it survives reloads). */
  fontId: string | null;
  /** Outer margin in mm (clamped to the paper size at render time). */
  margin: number;
  /** Title override; null => GitHub login. */
  title: string | null;
  /** Optional subtitle — only shown when explicitly set (no auto text). */
  subtitle: string | null;
  showStats: boolean;
  /** Show the style name + encoding legend at the bottom. */
  showLegend: boolean;
  /** Seed for deterministic randomness — keep it in config so art is reproducible. */
  seed: number;
  paper: PaperId;
  orientation: Orientation;
}

export const STYLE_LABELS: Record<StyleId, string> = {
  geometric: "抽象幾何",
  city: "都市・地形",
  organic: "有機・植物",
  stars: "粒子・星空",
};

// Title + encoding legend printed on the poster (matches the redesign concept).
export const STYLE_META: Record<StyleId, { name: string; legend: string }> = {
  geometric: {
    name: "ABSTRACT GEOMETRY",
    legend: "shape = contribution type / size = intensity / lines = streak continuity",
  },
  city: {
    name: "CITY / TERRAIN",
    legend: "x = time / building height = activity / contours = rhythm of long-term streaks",
  },
  organic: {
    name: "ORGANIC / PLANTS",
    legend: "stem height = active day / flowers = peaks / roots = hidden continuation",
  },
  stars: {
    name: "PARTICLES / STARS",
    legend: "particle = contribution / brightness = intensity / constellation = active streak",
  },
};

// Stored in PORTRAIT convention (w <= h); paperDims swaps for landscape.
export const PAPER_SIZES_MM: Record<PaperId, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
  card: { w: 55, h: 91 }, // Japanese business card (名刺) — 91x55 when landscape
};

export const PAPER_LABELS: Record<PaperId, string> = {
  A4: "A4",
  A3: "A3",
  A2: "A2",
  card: "名刺",
};

/** Physical poster dimensions in mm for the chosen paper + orientation. */
export function paperDims(paper: PaperId, orientation: Orientation): { w: number; h: number } {
  const { w, h } = PAPER_SIZES_MM[paper];
  return orientation === "portrait" ? { w, h } : { w: h, h: w };
}

/** Font stack used inside the SVG. For PDF, text is outlined (see export/outlineText). */
export const POSTER_FONT_STACK =
  "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif";

export interface FontOption {
  id: string;
  label: string;
  stack: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "sans", label: "ゴシック", stack: POSTER_FONT_STACK },
  {
    id: "serif",
    label: "明朝",
    stack: "Georgia, 'Times New Roman', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  },
  {
    id: "mono",
    label: "等幅",
    stack: "ui-monospace, 'SF Mono', Menlo, 'Courier New', monospace",
  },
  {
    id: "rounded",
    label: "丸ゴシック",
    stack: "'Hiragino Maru Gothic ProN', 'Quicksand', 'M PLUS Rounded 1c', system-ui, sans-serif",
  },
  {
    id: "condensed",
    label: "コンデンス",
    stack: "'Arial Narrow', 'Roboto Condensed', 'Oswald', sans-serif",
  },
];

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

export const PALETTES: Palette[] = [
  {
    id: "github",
    name: "GitHub Green",
    bg: "#0d1117",
    fg: "#e6edf3",
    accent: "#39d353",
    levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#1b1030",
    fg: "#ffe9d6",
    accent: "#ff9e57",
    levels: ["#2a1a3a", "#6b2a5a", "#b23a63", "#f06a3c", "#ffc15e"],
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: "#04141f",
    fg: "#dff6ff",
    accent: "#3ad0e6",
    levels: ["#0b2a3a", "#114b66", "#1f7a99", "#2ba8c4", "#5fe0ef"],
  },
  {
    id: "mono",
    name: "Mono Light",
    bg: "#f7f7f5",
    fg: "#1a1a1a",
    accent: "#111111",
    levels: ["#e7e7e3", "#bdbdb8", "#8a8a85", "#555550", "#1a1a1a"],
  },
  {
    id: "sakura",
    name: "Sakura",
    bg: "#fff5f7",
    fg: "#4a2330",
    accent: "#e86a92",
    levels: ["#f6dfe6", "#f3b9c9", "#ec8fae", "#e2638f", "#c83f73"],
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** The palette actually used for rendering (custom overrides the preset). */
export function resolvePalette(config: PosterConfig): Palette {
  return config.palette === "custom" ? config.custom : paletteById(config.palette);
}

export const DEFAULT_CONFIG: PosterConfig = {
  style: "geometric",
  palette: "github",
  custom: { ...PALETTES[0], id: "custom", name: "カスタム" },
  background: null,
  font: POSTER_FONT_STACK,
  fontUrl: null,
  fontWeight: 700,
  fontId: null,
  margin: 18,
  title: null,
  subtitle: null,
  showStats: true,
  showLegend: true,
  seed: 1,
  paper: "A3",
  orientation: "portrait",
};
