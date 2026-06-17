import { forwardRef } from "react";
import type { ContributionData } from "@/lib/github/types";
import {
  paperDims,
  resolvePalette,
  STYLE_META,
  type PosterConfig,
  type StyleId,
} from "@/lib/poster/config";
import type { Rect } from "@/lib/poster/geometry";
import { GeometricStyle } from "./styles/geometric";
import { CityStyle } from "./styles/city";
import { OrganicStyle } from "./styles/organic";
import { StarsStyle } from "./styles/stars";
import type { StyleProps } from "./styles/types";

const STYLE_MAP: Record<StyleId, (p: StyleProps) => React.ReactNode> = {
  geometric: GeometricStyle,
  city: CityStyle,
  organic: OrganicStyle,
  stars: StarsStyle,
};

export interface PosterProps {
  data: ContributionData;
  config: PosterConfig;
  className?: string;
  style?: React.CSSProperties;
}

// The poster SVG. viewBox is set so 1 unit = 1mm, and width/height carry real
// mm units for print. CSS (className/style) only scales the on-screen preview;
// the serialized attributes used for export are unaffected.
export const Poster = forwardRef<SVGSVGElement, PosterProps>(function Poster(
  { data, config, className, style },
  ref,
) {
  const { w, h } = paperDims(config.paper, config.orientation);
  const palette = resolvePalette(config);
  const bg = config.background ?? palette.bg;

  // Keep the margin sane on small papers (e.g. a 55mm card can't take 18mm).
  const m = Math.min(config.margin, Math.min(w, h) * 0.16);

  const title = config.title?.trim() || data.login;
  const subtitle = config.subtitle?.trim() || "";
  const titleSize = w * 0.05;
  const metaSize = w * 0.019;

  const subOffset = subtitle ? metaSize * 1.5 : 0;
  const statsOffset = config.showStats ? subOffset + metaSize * 1.6 : 0;
  const titleH = titleSize + Math.max(subOffset, statsOffset);

  const meta = STYLE_META[config.style];
  const legendH = config.showLegend ? metaSize * 2.7 : 0;

  const top = m + titleH + metaSize * 0.5;
  const area: Rect = { x: m, y: top, w: w - m * 2, h: h - m - legendH - top };

  const Style = STYLE_MAP[config.style];

  return (
    <svg
      ref={ref}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      width={`${w}mm`}
      height={`${h}mm`}
      viewBox={`0 0 ${w} ${h}`}
      data-poster="true"
    >
      <rect x={0} y={0} width={w} height={h} fill={bg} />

      <Style data={data} palette={palette} area={area} config={config} />

      <g fontFamily={config.font}>
        <text x={m} y={m + titleSize} fontWeight={config.fontWeight} fontSize={titleSize} fill={palette.fg}>
          {title}
        </text>
        {subtitle && (
          <text x={m} y={m + titleSize + metaSize * 1.5} fontSize={metaSize} fill={palette.fg} opacity={0.8}>
            {subtitle}
          </text>
        )}
        {config.showStats && (
          <text
            x={m}
            y={m + titleSize + statsOffset}
            fontSize={metaSize}
            fontWeight={600}
            fill={palette.accent}
          >
            {data.totalContributions.toLocaleString()} contributions
          </text>
        )}

        {config.showLegend && (
          <g>
            <text
              x={m}
              y={h - m - metaSize * 1.1}
              fontSize={metaSize * 0.62}
              fontWeight={600}
              letterSpacing={metaSize * 0.07}
              fill={palette.fg}
              opacity={0.85}
            >
              {meta.name}
            </text>
            <text x={m} y={h - m - metaSize * 0.2} fontSize={metaSize * 0.5} fill={palette.fg} opacity={0.45}>
              {meta.legend}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
});
