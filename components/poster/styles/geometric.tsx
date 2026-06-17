import type { StyleProps } from "./types";
import { gridLayout, flatDays, maxCount } from "@/lib/poster/geometry";
import { mulberry32, hashSeed } from "@/lib/poster/rng";

// Style D (redesign) — shapes drawn from the grid but pulled into a central
// cluster, threaded by thin "streak continuity" lines (consecutive active days)
// and crossed by faint orbital ellipses, over soft ambient circles.
// shape = contribution type / size = intensity / lines = streak continuity
export function GeometricStyle({ data, palette, area, config }: StyleProps) {
  const layout = gridLayout(data, area, 0.16);
  const days = flatDays(data);
  const max = Math.max(1, maxCount(data));
  const cell = Math.min(layout.cellW, layout.cellH);
  const cx0 = area.x + area.w / 2;
  const cy0 = area.y + area.h / 2;

  // Grid positions with a gentle pull toward the centre + seeded jitter — enough
  // to feel composed, but still spread across the canvas (not a tight blob).
  const pull = 0.16;
  const pos = days.map((p) => {
    const base = layout.cellPos(p.week, p.day);
    const rng = mulberry32(hashSeed(config.seed, p.index));
    let x = base.x + layout.cellW / 2;
    let y = base.y + layout.cellH / 2;
    x += (cx0 - x) * pull + (rng() - 0.5) * cell * 1.7;
    y += (cy0 - y) * pull + (rng() - 0.5) * cell * 1.7;
    return { x, y, p, rng };
  });

  const arng = mulberry32(hashSeed(config.seed, 9001));
  const ambient = Array.from({ length: 8 }, (_, i) => (
    <circle
      key={`amb${i}`}
      cx={area.x + arng() * area.w}
      cy={area.y + arng() * area.h}
      r={cell * (4 + arng() * 8)}
      fill={palette.levels[1 + Math.floor(arng() * 3)]}
      opacity={0.05}
    />
  ));

  const orng = mulberry32(hashSeed(config.seed, 4242));
  const clusterR = Math.min(area.w, area.h) * 0.46;
  const orbits = Array.from({ length: 6 }, (_, i) => {
    const rot = orng() * 180;
    return (
      <ellipse
        key={`orb${i}`}
        cx={cx0}
        cy={cy0}
        rx={clusterR * (0.5 + orng() * 0.9)}
        ry={clusterR * (0.2 + orng() * 0.5)}
        fill="none"
        stroke={palette.accent}
        strokeWidth={cell * 0.03}
        opacity={0.16}
        transform={`rotate(${rot.toFixed(1)} ${cx0.toFixed(1)} ${cy0.toFixed(1)})`}
      />
    );
  });

  const streaks = [];
  for (let i = 1; i < pos.length; i++) {
    if (pos[i].p.count > 0 && pos[i - 1].p.count > 0) {
      streaks.push(
        <line
          key={`st${i}`}
          x1={pos[i - 1].x}
          y1={pos[i - 1].y}
          x2={pos[i].x}
          y2={pos[i].y}
          stroke={palette.levels[2]}
          strokeWidth={cell * 0.04}
          opacity={0.22}
        />,
      );
    }
  }

  return (
    <g>
      {ambient}
      {orbits}
      {streaks}
      {pos.map(({ x, y, p, rng }) => {
        if (p.level === 0) {
          if (rng() < 0.7) return null;
          return <circle key={p.index} cx={x} cy={y} r={cell * 0.05} fill={palette.levels[1]} opacity={0.4} />;
        }
        const r = cell * (0.28 + 0.9 * Math.sqrt(p.count / max));
        const fill = rng() < 0.1 ? palette.accent : palette.levels[p.level];
        const opacity = 0.6 + rng() * 0.4;
        const rot = rng() * 360;
        const t = `rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`;
        const variant = Math.floor(rng() * 6);
        const k = p.index;
        if (variant === 0)
          return <circle key={k} cx={x} cy={y} r={r} fill="none" stroke={fill} strokeWidth={r * 0.2} opacity={opacity} />;
        if (variant === 1) return <circle key={k} cx={x} cy={y} r={r} fill={fill} opacity={opacity} />;
        if (variant === 2)
          return <rect key={k} x={x - r} y={y - r} width={r * 2} height={r * 2} rx={r * 0.18} fill={fill} opacity={opacity} transform={t} />;
        if (variant === 3) return <polygon key={k} points={triPts(x, y, r)} fill={fill} opacity={opacity} transform={t} />;
        if (variant === 4) return <polygon key={k} points={diamondPts(x, y, r)} fill={fill} opacity={opacity} />;
        return <polygon key={k} points={ngonPts(x, y, r, 5)} fill={fill} opacity={opacity} transform={t} />;
      })}
    </g>
  );
}

function fmtPts(arr: Array<[number, number]>): string {
  return arr.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}
function triPts(cx: number, cy: number, r: number) {
  return fmtPts([[cx, cy - r], [cx - r, cy + r], [cx + r, cy + r]]);
}
function diamondPts(cx: number, cy: number, r: number) {
  return fmtPts([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]);
}
function ngonPts(cx: number, cy: number, r: number, n: number) {
  const a: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }
  return fmtPts(a);
}
