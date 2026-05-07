export type Star = { readonly x: number; readonly y: number; readonly r: number; readonly o: number };
export type Stipple = { readonly x: number; readonly y: number; readonly r: number; readonly o: number };
export type ConstellationPoint = { readonly x: number; readonly y: number };
export type TwinkleStar = { readonly x: number; readonly y: number; readonly r: number; readonly d: string };

export const STARS_DIM: readonly Star[] = [
  { x: 40, y: 30, r: 0.6, o: 0.45 },
  { x: 95, y: 55, r: 0.5, o: 0.4 },
  { x: 165, y: 22, r: 0.7, o: 0.5 },
  { x: 220, y: 145, r: 0.6, o: 0.4 },
  { x: 275, y: 38, r: 0.5, o: 0.45 },
  { x: 340, y: 165, r: 0.7, o: 0.4 },
  { x: 410, y: 50, r: 0.6, o: 0.5 },
  { x: 470, y: 200, r: 0.5, o: 0.35 },
  { x: 540, y: 28, r: 0.7, o: 0.45 },
  { x: 605, y: 175, r: 0.6, o: 0.4 },
  { x: 680, y: 90, r: 0.6, o: 0.45 },
  { x: 760, y: 220, r: 0.5, o: 0.4 },
  { x: 825, y: 45, r: 0.7, o: 0.5 },
  { x: 1085, y: 280, r: 0.6, o: 0.4 },
  { x: 1140, y: 60, r: 0.6, o: 0.45 },
  { x: 30, y: 180, r: 0.5, o: 0.35 },
  { x: 75, y: 250, r: 0.6, o: 0.4 },
  { x: 195, y: 295, r: 0.5, o: 0.35 },
  { x: 380, y: 270, r: 0.6, o: 0.4 },
  { x: 510, y: 310, r: 0.5, o: 0.35 },
  { x: 720, y: 330, r: 0.6, o: 0.4 },
  { x: 1020, y: 195, r: 0.5, o: 0.4 },
  { x: 1170, y: 250, r: 0.6, o: 0.4 },
];

export const STARS_MID: readonly Star[] = [
  { x: 60, y: 110, r: 1.0, o: 0.7 },
  { x: 135, y: 175, r: 1.1, o: 0.75 },
  { x: 245, y: 65, r: 1.0, o: 0.7 },
  { x: 310, y: 235, r: 1.0, o: 0.65 },
  { x: 425, y: 130, r: 1.1, o: 0.75 },
  { x: 555, y: 95, r: 1.0, o: 0.7 },
  { x: 645, y: 245, r: 1.0, o: 0.7 },
  { x: 770, y: 105, r: 1.1, o: 0.75 },
  { x: 870, y: 230, r: 1.0, o: 0.7 },
  { x: 1050, y: 110, r: 1.0, o: 0.7 },
  { x: 1115, y: 170, r: 1.1, o: 0.75 },
  { x: 480, y: 250, r: 0.9, o: 0.6 },
];

export const STARS_BRIGHT: readonly Star[] = [
  { x: 165, y: 230, r: 1.6, o: 0.95 },
  { x: 410, y: 300, r: 1.5, o: 0.9 },
  { x: 590, y: 35, r: 1.7, o: 1 },
  { x: 800, y: 280, r: 1.5, o: 0.9 },
];

export const CONSTELLATION: readonly ConstellationPoint[] = [
  { x: 65, y: 75 },
  { x: 115, y: 110 },
  { x: 175, y: 80 },
  { x: 235, y: 115 },
  { x: 295, y: 90 },
  { x: 360, y: 70 },
];

export const TWINKLE_STARS: readonly TwinkleStar[] = [
  { x: 245, y: 65, r: 1.2, d: "3.2s" },
  { x: 590, y: 35, r: 1.8, d: "4.5s" },
  { x: 1090, y: 50, r: 1.6, d: "2.8s" },
  { x: 410, y: 300, r: 1.5, d: "3.8s" },
];

export const STAR_DIM_COLORS = ["#D8D2C0", "#C8D0E0", "#E0DAC8", "#D0CED2"] as const;
export const STAR_MID_COLORS = ["#E8E0CD", "#D8E0F2", "#F0E5B5", "#E5D8C8"] as const;
export const STAR_BRIGHT_COLORS = ["#F5EDE0", "#D5DCF5", "#F5E8B5", "#E89C7A"] as const;

/* Deterministic linear-congruential generator: seed=24601 produces the
   exact pebble distribution the scene was tuned against. Do not change. */
function generateStipples(count: number, yMin: number, yMax: number, xMax: number): readonly Stipple[] {
  let seed = 24601;
  const rand = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: Stipple[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      x: rand() * xMax,
      y: yMin + Math.pow(rand(), 0.6) * (yMax - yMin),
      r: 0.3 + rand() * 0.7,
      o: 0.10 + rand() * 0.30,
    });
  }
  return out;
}

export const SAND_STIPPLES_DARK: readonly Stipple[] = generateStipples(110, 440, 600, 1200);
export const SAND_STIPPLES_LIGHT: readonly Stipple[] = generateStipples(80, 460, 600, 1200);
