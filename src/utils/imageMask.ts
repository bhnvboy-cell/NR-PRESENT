import type { ImageElement, ImageMaskKind } from '../types/editor';
import { cropRect } from './imageCrop';
import { polygonPoints } from './geometry';

export function hasImageMask(el: ImageElement): boolean {
  return Boolean(el.mask && el.mask !== 'none');
}

function traceMaskPath(ctx: CanvasRenderingContext2D, mask: ImageMaskKind, w: number, h: number): void {
  ctx.beginPath();
  switch (mask) {
    case 'circle':
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.closePath();
      return;
    case 'arch': {
      const r = Math.min(w / 2, h * 0.48);
      ctx.moveTo(0, r);
      ctx.arc(w / 2, r, w / 2, Math.PI, 0, false);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      return;
    }
    case 'heart': {
      const topCurveHeight = h * 0.3;
      ctx.moveTo(w / 2, h * 0.25);
      ctx.bezierCurveTo(w / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.bezierCurveTo(0, (h + topCurveHeight) / 2, w / 2, (h + topCurveHeight) / 1.4, w / 2, h);
      ctx.bezierCurveTo(w / 2, (h + topCurveHeight) / 1.4, w, (h + topCurveHeight) / 2, w, topCurveHeight);
      ctx.bezierCurveTo(w, 0, w / 2, 0, w / 2, h * 0.25);
      ctx.closePath();
      return;
    }
    case 'diamond':
    case 'triangle':
    case 'hexagon':
    case 'star': {
      const pts = polygonPoints(mask, w, h);
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(pts[i], pts[i + 1]);
      }
      ctx.closePath();
      return;
    }
    default:
      ctx.rect(0, 0, w, h);
      ctx.closePath();
  }
}

function drawCroppedImageIntoRect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  el: ImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    const grad = ctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = grad;
    ctx.fillRect(dx, dy, dw, dh);
    return;
  }
  const crop = cropRect(el, { width: img.naturalWidth, height: img.naturalHeight });
  if (crop) {
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, dx, dy, dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}

export function drawMaskedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  el: ImageElement,
): void {
  const mask = el.mask ?? 'none';
  const w = el.width;
  const h = el.height;
  const frameColor = el.frameColor || '#1e293b';

  ctx.save();

  if (mask === 'laptop') {
    const screenW = w * 0.84;
    const screenH = h * 0.86;
    const screenX = (w - screenW) / 2;
    const screenY = h * 0.03;
    const pad = Math.max(6, Math.min(w, h) * 0.035);

    // Outer bezel
    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(screenX, screenY, screenW, screenH, 12);
    ctx.fill();

    // Camera dot
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(w / 2, screenY + pad * 0.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner screen clip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(screenX + pad, screenY + pad, screenW - pad * 2, screenH - pad * 1.8, 4);
    ctx.clip();
    drawCroppedImageIntoRect(ctx, img, el, screenX + pad, screenY + pad, screenW - pad * 2, screenH - pad * 1.8);
    ctx.restore();

    // Laptop base deck
    const baseY = screenY + screenH;
    const baseH = Math.max(8, h * 0.08);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(0, baseY, w, baseH, [2, 2, 10, 10]);
    ctx.fill();

    // Trackpad notch
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(w * 0.42, baseY, w * 0.16, baseH * 0.4, [0, 0, 4, 4]);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (mask === 'phone') {
    const bezelR = Math.min(w, h) * 0.12;
    const pad = Math.max(6, Math.min(w, h) * 0.045);

    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, bezelR);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, Math.max(4, bezelR - pad * 0.8));
    ctx.clip();
    drawCroppedImageIntoRect(ctx, img, el, pad, pad, w - pad * 2, h - pad * 2);
    ctx.restore();

    // Dynamic island pill
    const pillW = w * 0.28;
    const pillH = Math.max(6, h * 0.028);
    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect((w - pillW) / 2, pad + 6, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (mask === 'browser') {
    const barH = Math.max(24, Math.min(40, h * 0.11));
    const radius = 10;

    // Chrome top bar
    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.fill();

    // Traffic lights
    const dotR = Math.max(3.5, barH * 0.15);
    const dotY = barH / 2;
    const colors = ['#ef4444', '#f59e0b', '#10b981'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(14 + i * (dotR * 3), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
    });

    // Address bar pill
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(w * 0.22, barH * 0.22, w * 0.56, barH * 0.56, 6);
    ctx.fill();

    // Viewport content
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(2, barH, w - 4, h - barH - 2, [0, 0, radius - 2, radius - 2]);
    ctx.clip();
    drawCroppedImageIntoRect(ctx, img, el, 2, barH, w - 4, h - barH - 2);
    ctx.restore();

    ctx.restore();
    return;
  }

  // Shape masks
  traceMaskPath(ctx, mask, w, h);
  ctx.save();
  ctx.clip();
  drawCroppedImageIntoRect(ctx, img, el, 0, 0, w, h);
  ctx.restore();

  if (el.frameColor) {
    traceMaskPath(ctx, mask, w, h);
    ctx.strokeStyle = el.frameColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.restore();
}

export function createFramePlaceholderDataUrl(title = 'Drop or replace image', accent = '#6366f1'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="55%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#sky)"/>
    <circle cx="490" cy="120" r="52" fill="rgba(255,255,255,0.75)"/>
    <path d="M0 370 L180 220 L340 350 L460 250 L640 390 L640 480 L0 480 Z" fill="rgba(15,23,42,0.32)"/>
    <path d="M0 410 L240 290 L430 400 L640 310 L640 480 L0 480 Z" fill="rgba(15,23,42,0.52)"/>
    <text x="320" y="445" font-family="Inter, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.9)" text-anchor="middle">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
