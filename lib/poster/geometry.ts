import type { ContributionData } from "@/lib/github/types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridLayout {
  /** Number of weeks (52-54, taken from the data — never hardcoded). */
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  gap: number;
  area: Rect;
  /** Top-left of the cell at (weekIndex, weekday). */
  cellPos: (week: number, weekday: number) => { x: number; y: number };
}

/** Lay the 7 x N grid into `area`, keeping square-ish cells and centering it. */
export function gridLayout(data: ContributionData, area: Rect, gapRatio = 0.14): GridLayout {
  const cols = data.weeks.length;
  const rows = 7;
  const stepX = area.w / cols;
  const stepY = area.h / rows;
  const gap = Math.min(stepX, stepY) * gapRatio;
  const cellW = stepX - gap;
  const cellH = stepY - gap;
  const offX = area.x + (area.w - cols * stepX) / 2;
  const offY = area.y + (area.h - rows * stepY) / 2;
  return {
    cols,
    rows,
    cellW,
    cellH,
    gap,
    area,
    cellPos: (week, weekday) => ({
      x: offX + week * stepX + gap / 2,
      y: offY + weekday * stepY + gap / 2,
    }),
  };
}

export interface PlacedDay {
  week: number;
  /** weekday 0..6 (grid row). */
  day: number;
  date: string;
  count: number;
  level: number;
  /** Chronological index across the whole year (for left-to-right styles). */
  index: number;
}

/** Flatten weeks into a chronological list, tagging grid position and index. */
export function flatDays(data: ContributionData): PlacedDay[] {
  const out: PlacedDay[] = [];
  let index = 0;
  data.weeks.forEach((wk, week) => {
    wk.days.forEach((d) => {
      out.push({
        week,
        day: d.weekday,
        date: d.date,
        count: d.count,
        level: d.level,
        index: index++,
      });
    });
  });
  return out;
}

export function maxCount(data: ContributionData): number {
  let m = 0;
  for (const wk of data.weeks) for (const d of wk.days) if (d.count > m) m = d.count;
  return m;
}
