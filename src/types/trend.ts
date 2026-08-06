export interface TrendItem {
  id: number;
  name: string;
  kind: string | null;
  description: string | null;
  image_url: string | null;
  rise_pct: number | null;
  sources: string[] | null;
  spice: number | null;
  fill: number | null;
  warm: number | null;
  ease: number | null;
  comfort: number | null;
  light: number | null;
  matched_food_name: string | null;
  rank: number;
}
