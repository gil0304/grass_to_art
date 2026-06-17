import type { StyleProps } from "./types";
import { flatDays, maxCount } from "@/lib/poster/geometry";
import { mulberry32, hashSeed } from "@/lib/poster/rng";

// Style B (redesign) — peaks become flowers (stem + petals + leaf), with a
// sparse understory of blades and roots trailing below the ground line.
// stem height = active day / flowers = peaks / roots = hidden continuation
export function OrganicStyle({ data, palette, area, config }: StyleProps) {
  const days = flatDays(data);
  const n = days.length;
  const max = Math.max(1, maxCount(data));
  const baseY = area.y + area.h;
  const stepX = area.w / n;
  const rng = mulberry32(config.seed);

  // Grass field — every active day, blade height by count, so the silhouette
  // clearly reads the rise and fall of activity across the year.
  const understory = days
    .filter((p) => p.count > 0)
    .map((p) => {
      const x = area.x + (p.index + 0.5) * stepX;
      const hgt = Math.max(area.h * 0.015, (p.count / max) * area.h * 0.5);
      const sway = (rng() - 0.5) * stepX * 4;
      const half = Math.max(0.18, stepX * 0.38);
      const d = `M ${(x - half).toFixed(1)} ${baseY.toFixed(1)} Q ${(x + sway * 0.5).toFixed(1)} ${(baseY - hgt * 0.6).toFixed(1)} ${(x + sway).toFixed(1)} ${(baseY - hgt).toFixed(1)} Q ${(x + sway * 0.5).toFixed(1)} ${(baseY - hgt * 0.6).toFixed(1)} ${(x + half).toFixed(1)} ${baseY.toFixed(1)} Z`;
      return <path key={`u${p.index}`} d={d} fill={palette.levels[Math.max(1, p.level)]} opacity={0.6} />;
    });

  // One flower per horizontal bucket = the peak day there (spread across width).
  const buckets = Math.min(22, Math.max(6, Math.round(area.w / 14)));
  const flowers = [];
  for (let b = 0; b < buckets; b++) {
    const lo = Math.floor((b * n) / buckets);
    const hi = Math.floor(((b + 1) * n) / buckets);
    let best = -1;
    let bestC = 0;
    for (let i = lo; i < hi; i++) {
      if (days[i].count > bestC) {
        bestC = days[i].count;
        best = i;
      }
    }
    if (best < 0 || bestC <= 0) continue;

    const p = days[best];
    const frng = mulberry32(hashSeed(config.seed, p.index));
    const x = area.x + (best + 0.5) * stepX;
    // Linear-ish height so peaks clearly differ in height (readable increase/decrease).
    const stemH = (0.32 + 0.6 * (p.count / max)) * area.h;
    const sway = (frng() - 0.5) * area.w * 0.05;
    const tipX = x + sway;
    const tipY = baseY - stemH;
    // Modest, fairly uniform heads (independent of stem height) so tall flowers
    // don't balloon into a blob.
    const headR = area.w * 0.02 * (0.85 + frng() * 0.35);

    const np = 6 + Math.floor(frng() * 3);
    const petals = [];
    for (let k = 0; k < np; k++) {
      const a = (k / np) * Math.PI * 2;
      const px = tipX + Math.cos(a) * headR;
      const py = tipY + Math.sin(a) * headR;
      petals.push(
        <ellipse
          key={k}
          cx={px}
          cy={py}
          rx={headR * 0.72}
          ry={headR * 0.42}
          fill={palette.levels[4]}
          opacity={0.92}
          transform={`rotate(${((a * 180) / Math.PI).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})`}
        />,
      );
    }

    const leafY = baseY - stemH * 0.45;
    const side = frng() < 0.5 ? -1 : 1;
    const leaf = `M ${x.toFixed(1)} ${leafY.toFixed(1)} Q ${(x + side * headR * 1.6).toFixed(1)} ${(leafY - headR).toFixed(1)} ${(x + side * headR * 2.6).toFixed(1)} ${leafY.toFixed(1)} Q ${(x + side * headR * 1.6).toFixed(1)} ${(leafY + headR * 0.6).toFixed(1)} ${x.toFixed(1)} ${leafY.toFixed(1)} Z`;

    flowers.push(
      <g key={`f${p.index}`}>
        <path
          d={`M ${x.toFixed(1)} ${baseY.toFixed(1)} Q ${(x + sway * 0.4).toFixed(1)} ${(baseY - stemH * 0.5).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
          fill="none"
          stroke={palette.levels[2]}
          strokeWidth={Math.max(0.3, area.w * 0.004)}
        />
        <path d={leaf} fill={palette.levels[2]} opacity={0.8} />
        {petals}
        <circle cx={tipX} cy={tipY} r={headR * 0.62} fill={palette.accent} />
      </g>,
    );
  }

  const roots = Array.from({ length: Math.max(4, Math.round(buckets * 0.5)) }, (_, i) => {
    const x = area.x + rng() * area.w;
    const depth = area.h * (0.06 + rng() * 0.1);
    const wob = (rng() - 0.5) * area.w * 0.03;
    return (
      <path
        key={`r${i}`}
        d={`M ${x.toFixed(1)} ${baseY.toFixed(1)} Q ${(x + wob).toFixed(1)} ${(baseY + depth * 0.5).toFixed(1)} ${(x + wob * 1.5).toFixed(1)} ${(baseY + depth).toFixed(1)}`}
        fill="none"
        stroke={palette.levels[1]}
        strokeWidth={Math.max(0.2, area.w * 0.002)}
        opacity={0.4}
      />
    );
  });

  return (
    <g>
      {roots}
      {understory}
      {flowers}
      <rect x={area.x} y={baseY} width={area.w} height={Math.max(0.3, area.h * 0.003)} fill={palette.levels[2]} opacity={0.5} />
    </g>
  );
}
