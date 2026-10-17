import Konva from 'konva';
import type { ImageFilterPreset, ImageFilters } from '../types/editor';

interface PresetDef {
  brightness: number;
  contrast: number;
  saturation: number;
  hue?: number;
  sepia?: number;
  invert?: boolean;
}

const PRESETS: Record<ImageFilterPreset, PresetDef> = {
  none: { brightness: 0, contrast: 0, saturation: 0 },
  grayscale: { brightness: 0, contrast: 0, saturation: -1 },
  sepia: { brightness: 0.05, contrast: 0.05, saturation: -0.6, sepia: 0.8 },
  invert: { brightness: 0, contrast: 0, saturation: 0, invert: true },
  warm: { brightness: 0.05, contrast: 0.05, saturation: 0.15, hue: -10 },
  cool: { brightness: 0, contrast: 0.05, saturation: 0.1, hue: 20 },
  vintage: { brightness: 0.08, contrast: -0.05, saturation: -0.35, sepia: 0.35 },
};

/**
 * Compose a Konva filter pipeline from user sliders + a preset. Returns a
 * `filter` array and the corresponding `filters*` config for the Konva.Image.
 */
export function buildImageFilters(filters: ImageFilters): {
  filter: Konva.Filter[];
  config: Record<string, unknown>;
} {
  const preset = PRESETS[filters.preset] ?? PRESETS.none;

  const brightness = clampUnit(filters.brightness + preset.brightness);
  const contrast = clampUnit(filters.contrast + preset.contrast);
  const saturation = clampUnit(filters.saturation + preset.saturation);

  const filter: Konva.Filter[] = [];
  const config: Record<string, unknown> = {};

  if (brightness !== 0) {
    filter.push(Konva.Filters.Brighten);
    config.brightness = brightness;
  }
  if (contrast !== 0) {
    filter.push(Konva.Filters.Contrast);
    config.contrast = contrast * 100;
  }
  if (saturation !== 0 || preset.hue !== undefined) {
    filter.push(Konva.Filters.HSL);
    config.hue = preset.hue ?? 0;
    config.saturation = saturation;
  }
  if (preset.sepia) {
    filter.push(Konva.Filters.Sepia);
  }
  if (preset.invert) {
    filter.push(Konva.Filters.Invert);
  }
  if (filters.blur > 0) {
    filter.push(Konva.Filters.Blur);
    config.blurRadius = filters.blur;
  }

  if (filter.length === 0) {
    return { filter: [], config: {} };
  }
  return { filter, config };
}

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export const FILTER_PRESET_OPTIONS: { value: ImageFilterPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'invert', label: 'Invert' },
];
