import type { ImageElement } from '../types/editor';

export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NaturalSize {
  width: number;
  height: number;
}

/** Konva crop rect in source pixels, or undefined when no crop is set. */
export function cropRect(element: ImageElement, natural: NaturalSize): ImageCrop | undefined {
  const crop = element.crop;
  if (!crop || crop.width <= 0 || crop.height <= 0) return undefined;
  const maxX = Math.max(0, natural.width - 1);
  const maxY = Math.max(0, natural.height - 1);
  const x = Math.min(Math.max(0, crop.x), maxX);
  const y = Math.min(Math.max(0, crop.y), maxY);
  const width = Math.min(crop.width, natural.width - x);
  const height = Math.min(crop.height, natural.height - y);
  if (width <= 0 || height <= 0) return undefined;
  return { x, y, width, height };
}

/**
 * Center-weighted "cover" crop of the natural image to a target aspect ratio.
 * `fx`/`fy` are focal points in 0..1 (0.5 = centered).
 */
export function coverCrop(natural: NaturalSize, aspect: number, fx = 0.5, fy = 0.5): ImageCrop {
  const { width, height } = natural;
  let cropW = width;
  let cropH = width / aspect;
  if (cropH > height) {
    cropH = height;
    cropW = height * aspect;
  }
  const x = Math.min(Math.max(0, fx * width - cropW / 2), width - cropW);
  const y = Math.min(Math.max(0, fy * height - cropH / 2), height - cropH);
  return { x: Math.round(x), y: Math.round(y), width: Math.round(cropW), height: Math.round(cropH) };
}

export const CROP_PRESETS: { label: string; aspect: number | null }[] = [
  { label: 'Original', aspect: null },
  { label: '1:1', aspect: 1 },
  { label: '4:3', aspect: 4 / 3 },
  { label: '16:9', aspect: 16 / 9 },
  { label: '3:4', aspect: 3 / 4 },
  { label: '9:16', aspect: 9 / 16 },
];
