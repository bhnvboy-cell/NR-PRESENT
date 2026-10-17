import type Konva from 'konva';
import type { SlideBackground } from '../types/editor';

function polarAngle(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

function linearEndPoints(cx: number, cy: number, w: number, h: number, angleDeg: number) {
  const angle = polarAngle(angleDeg);
  const length = Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle));
  const half = length / 2;
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;
  return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
}

/** Konva-ready fill props for a slide background. */
export function backgroundToKonva(bg: SlideBackground, width: number, height: number): Partial<Konva.RectConfig> {
  if (bg.kind === 'solid') {
    return { fill: bg.color };
  }
  if (bg.kind === 'linear') {
    const { x1, y1, x2, y2 } = linearEndPoints(width / 2, height / 2, width, height, bg.angle);
    return {
      fillLinearGradientStartPoint: { x: x1, y: y1 },
      fillLinearGradientEndPoint: { x: x2, y: y2 },
      fillLinearGradientColorStops: [0, bg.from, 1, bg.to],
    };
  }
  const radius = Math.max(width, height) / 1.4;
  return {
    fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: radius,
    fillRadialGradientColorStops: [0, bg.from, 1, bg.to],
  };
}

/** CSS equivalent for HTML surfaces (thumbnails side panel, export fallback). */
export function backgroundToCss(bg: SlideBackground): string {
  if (bg.kind === 'solid') return bg.color;
  if (bg.kind === 'linear') return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
  return `radial-gradient(circle at 50% 50%, ${bg.from}, ${bg.to})`;
}

export function describeBackground(bg: SlideBackground): string {
  if (bg.kind === 'solid') return bg.color;
  if (bg.kind === 'linear') return `${bg.from}→${bg.to}`;
  return `${bg.from} rad`;
}
