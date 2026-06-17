import type { StyleProps } from "./types";
import { gridLayout, flatDays } from "@/lib/poster/geometry";
import { mulberry32 } from "@/lib/poster/rng";

// Style C (redesign) — a constellation: stars from active days, linked along
// streaks (consecutive days), over background dust, a sweeping ribbon, and a
// faint ringed planet. Plain shapes only, so SVG -> PDF survives intact.
// particle = contribution / brightness = intensity / constellation = active streak
export function StarsStyle({ data, palette, area, config }: StyleProps) {
  const layout = gridLayout(data, area, 0.05);
  const rng = mulberry32(config.seed);
  const unit = Math.min(layout.cellW, layout.cellH);

  const ribbon = `M ${area.x.toFixed(1)} ${(area.y + area.h * 0.7).toFixed(1)} C ${(area.x + area.w * 0.3).toFixed(1)} ${(area.y + area.h * (0.3 + rng() * 0.2)).toFixed(1)}, ${(area.x + area.w * 0.6).toFixed(1)} ${(area.y + area.h * 0.82).toFixed(1)}, ${(area.x + area.w).toFixed(1)} ${(area.y + area.h * 0.35).toFixed(1)}`;

  const dust = Array.from({ length: 200 }, (_, i) => (
    <circle
      key={`d${i}`}
      cx={area.x + rng() * area.w}
      cy={area.y + rng() * area.h}
      r={unit * (0.02 + rng() * 0.05)}
      fill={palette.fg}
      opacity={0.12 + rng() * 0.22}
    />
  ));

  const plX = area.x + area.w * (0.82 + rng() * 0.1);
  const plY = area.y + area.h * (0.58 + rng() * 0.22);
  const plR = Math.min(area.w, area.h) * 0.05;

  const stars = flatDays(data)
    .filter((p) => p.count > 0)
    .map((p) => {
      const b = layout.cellPos(p.week, p.day);
      return {
        x: b.x + layout.cellW / 2 + (rng() - 0.5) * layout.cellW * 1.4,
        y: b.y + layout.cellH / 2 + (rng() - 0.5) * layout.cellH * 1.4,
        level: p.level,
        index: p.index,
      };
    });

  // Constellation lines connect consecutive days (a streak).
  const lines = [];
  for (let i = 1; i < stars.length; i++) {
    if (stars[i].index === stars[i - 1].index + 1) {
      lines.push(
        <line
          key={`c${i}`}
          x1={stars[i - 1].x}
          y1={stars[i - 1].y}
          x2={stars[i].x}
          y2={stars[i].y}
          stroke={palette.accent}
          strokeWidth={unit * 0.03}
          opacity={0.3}
        />,
      );
    }
  }

  return (
    <g>
      <path d={ribbon} fill="none" stroke={palette.levels[2]} strokeWidth={unit * 1.8} opacity={0.06} strokeLinecap="round" />
      <path d={ribbon} fill="none" stroke={palette.accent} strokeWidth={unit * 0.5} opacity={0.08} strokeLinecap="round" />
      {dust}
      <ellipse
        cx={plX}
        cy={plY}
        rx={plR * 1.9}
        ry={plR * 0.5}
        fill="none"
        stroke={palette.fg}
        strokeWidth={unit * 0.06}
        opacity={0.15}
        transform={`rotate(-18 ${plX.toFixed(1)} ${plY.toFixed(1)})`}
      />
      <circle cx={plX} cy={plY} r={plR} fill={palette.levels[2]} opacity={0.4} />
      {lines}
      {stars.map((s) => {
        const r = unit * (0.1 + s.level * 0.14);
        const fill = palette.levels[Math.max(1, s.level)];
        const hero = s.level >= 4;
        return (
          <g key={s.index}>
            {s.level >= 3 && <circle cx={s.x} cy={s.y} r={r * 2.6} fill={fill} opacity={0.14} />}
            <circle cx={s.x} cy={s.y} r={r} fill={hero ? "#ffffff" : fill} />
            {hero && (
              <g stroke="#ffffff" strokeWidth={r * 0.22} opacity={0.9} strokeLinecap="round">
                <line x1={s.x - r * 3} y1={s.y} x2={s.x + r * 3} y2={s.y} />
                <line x1={s.x} y1={s.y - r * 3} x2={s.x} y2={s.y + r * 3} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
