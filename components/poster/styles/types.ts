import type { ContributionData } from "@/lib/github/types";
import type { Palette, PosterConfig } from "@/lib/poster/config";
import type { Rect } from "@/lib/poster/geometry";

// Every style is a pure function of (data, palette, drawing area, config) and
// returns SVG nodes. Coordinates are in mm (the poster's viewBox is 1 unit = 1mm).
export interface StyleProps {
  data: ContributionData;
  palette: Palette;
  area: Rect;
  config: PosterConfig;
}
