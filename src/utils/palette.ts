/**
 * Deterministic harmonious palette generator. Given a single seed color it
 * derives a full brand palette (complementary / analogous / triadic / split /
 * tetradic) using HSL math — no network, no AI backend required.
 */

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type HarmonyKind =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split'
  | 'tetradic'
  | 'monochrome';

export const HARMONY_OPTIONS: { value: HarmonyKind; label: string }[] = [
  { value: 'complementary', label: 'Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split', label: 'Split complementary' },
  { value: 'tetradic', label: 'Tetradic' },
  { value: 'monochrome', label: 'Monochrome' },
];

/** Derive a 5–6 color palette from a seed using the chosen harmony. */
export function generatePalette(seed: string, harmony: HarmonyKind): string[] {
  const { h, s, l } = hexToHsl(seed);
  const base = seed;
  switch (harmony) {
    case 'complementary':
      return [
        base,
        hslToHex(h, s, Math.min(75, l + 12)),
        hslToHex(h + 180, s, l),
        hslToHex(h + 180, s, Math.min(75, l + 12)),
        hslToHex(h, Math.max(20, s - 30), Math.min(90, l + 30)),
      ];
    case 'analogous':
      return [
        hslToHex(h - 30, s, l),
        hslToHex(h - 15, s, l),
        base,
        hslToHex(h + 15, s, l),
        hslToHex(h + 30, s, l),
      ];
    case 'triadic':
      return [base, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l), hslToHex(h + 120, s, l + 15), hslToHex(h + 240, s, l + 15)];
    case 'split':
      return [base, hslToHex(h + 150, s, l), hslToHex(h + 210, s, l), hslToHex(h + 150, s, l + 15), hslToHex(h + 210, s, l + 15)];
    case 'tetradic':
      return [base, hslToHex(h + 90, s, l), hslToHex(h + 180, s, l), hslToHex(h + 270, s, l), hslToHex(h + 180, s, l + 15)];
    case 'monochrome':
    default:
      return [
        hslToHex(h, s, Math.max(15, l - 25)),
        hslToHex(h, s, Math.max(25, l - 12)),
        base,
        hslToHex(h, s, Math.min(78, l + 12)),
        hslToHex(h, Math.max(15, s - 20), Math.min(92, l + 30)),
      ];
  }
}

/** Curated seed colors for one-click palettes. */
export const SEED_COLORS: string[] = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#22c55e',
  '#e11d48',
];
