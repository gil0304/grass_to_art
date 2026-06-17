import type { StyleProps } from "./types";
import { flatDays, maxCount } from "@/lib/poster/geometry";
import { mulberry32 } from "@/lib/poster/rng";

// Style A (redesign) — a skyline of thin day-towers, a concentric-ring sun, and
// smooth "contour" lines (moving averages) showing the rhythm of long streaks.
// x = time / building height = activity / contours = rhythm of long-term streaks
export function CityStyle({ data, palette, area, config }: StyleProps) {
  const days = flatDays(data);
  const n = days.length;
  const max = Math.max(1, maxCount(data));
  const stepX = area.w / n;
  const baseY = area.y + area.h;
  const maxH = area.h * 0.82;

  const sun = mulberry32(config.seed);
  const sunX = area.x + area.w * (0.78 + sun() * 0.12);
  const sunY = area.y + area.h * (0.16 + sun() * 0.12);
  const sunR = Math.min(area.w, area.h) * 0.06;

  // Moving-average contour of chronological counts.
  const win = Math.max(3, Math.round(n * 0.04));
  const avg = (i: number) => {
    let s = 0;
    let c = 0;
    for (let k = -win; k <= win; k++) {
      const j = i + k;
      if (j >= 0 && j < n) {
        s += days[j].count;
        c++;
      }
    }
    return c ? s / c : 0;
  };
  const contourBase = baseY - area.h * 0.16;
  const contourH = area.h * 0.55;
  const contourPath = (scale: number) => {
    let d = "";
    for (let i = 0; i < n; i++) {
      const x = area.x + i * stepX;
      const y = contourBase - (avg(i) / max) * contourH * scale;
      d += (i === 0 ? "M " : " L ") + `${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <g>
      {[3, 2.2, 1.5].map((k, i) => (
        <circle key={i} cx={sunX} cy={sunY} r={sunR * k} fill="none" stroke={palette.accent} strokeWidth={sunR * 0.05} opacity={0.22} />
      ))}
      <circle cx={sunX} cy={sunY} r={sunR} fill={palette.accent} opacity={0.85} />

      {days.map((p, i) => {
        if (p.count === 0) return null;
        const hgt = Math.max(area.h * 0.01, (p.count / max) * maxH);
        const x = area.x + i * stepX;
        return (
          <rect
            key={p.index}
            x={x}
            y={baseY - hgt}
            width={stepX * 0.6}
            height={hgt}
            fill={palette.levels[Math.max(1, p.level)]}
            opacity={0.92}
          />
        );
      })}

      <path d={contourPath(1)} fill="none" stroke={palette.accent} strokeWidth={area.h * 0.004} opacity={0.55} strokeLinejoin="round" />
      <path d={contourPath(0.6)} fill="none" stroke={palette.fg} strokeWidth={area.h * 0.0025} opacity={0.22} strokeLinejoin="round" />

      <rect x={area.x} y={baseY} width={area.w} height={Math.max(0.4, area.h * 0.004)} fill={palette.accent} opacity={0.7} />
    </g>
  );
}
