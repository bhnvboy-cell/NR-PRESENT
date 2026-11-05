import type { TextElement } from '../types/editor';

export function hasCustomTextRender(el: TextElement): boolean {
  const curve = el.curve ?? 0;
  const effect = el.effect ?? 'none';
  const strokeW = el.strokeWidth ?? 0;
  return Math.abs(curve) >= 1 || effect !== 'none' || strokeW > 0;
}

function buildFontString(el: TextElement): string {
  const style = el.italic ? 'italic' : 'normal';
  return `${style} ${el.fontWeight} ${el.fontSize}px "${el.fontFamily}", sans-serif`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, letterSpacing: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let current = words[0] ?? '';
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${current} ${words[i]}`;
      const width = measureWithSpacing(ctx, candidate, letterSpacing);
      if (width > maxWidth && current.length > 0) {
        lines.push(current);
        current = words[i];
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

function measureWithSpacing(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number): number {
  if (!text) return 0;
  return ctx.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
}

function drawGlyphRun(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  letterSpacing: number,
  mode: 'fill' | 'stroke',
): void {
  if (letterSpacing === 0) {
    if (mode === 'fill') ctx.fillText(line, x, y);
    else ctx.strokeText(line, x, y);
    return;
  }
  let cursor = x;
  for (const ch of line) {
    if (mode === 'fill') ctx.fillText(ch, cursor, y);
    else ctx.strokeText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + letterSpacing;
  }
}

function renderPass(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  drawLine: (line: string, lineIdx: number, mode: 'fill' | 'stroke', dx: number, dy: number) => void,
  lines: string[],
): void {
  const effect = el.effect ?? 'none';
  const strokeColor = el.stroke || el.fill;
  const baseStrokeW = el.strokeWidth && el.strokeWidth > 0 ? el.strokeWidth : Math.max(2, el.fontSize * 0.05);

  if (effect === 'echo') {
    ctx.save();
    ctx.fillStyle = el.stroke || el.fill;
    ctx.globalAlpha = 0.22;
    lines.forEach((line, i) => drawLine(line, i, 'fill', 8, 8));
    ctx.globalAlpha = 0.45;
    lines.forEach((line, i) => drawLine(line, i, 'fill', 4, 4));
    ctx.restore();
    ctx.fillStyle = el.fill;
    lines.forEach((line, i) => drawLine(line, i, 'fill', 0, 0));
    return;
  }

  if (effect === 'splice') {
    const offset = Math.max(3, Math.round(el.fontSize * 0.07));
    ctx.save();
    ctx.fillStyle = el.stroke || '#a5b4fc';
    ctx.globalAlpha = 0.55;
    lines.forEach((line, i) => drawLine(line, i, 'fill', offset, offset));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = el.fill;
    ctx.lineWidth = baseStrokeW;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => drawLine(line, i, 'stroke', 0, 0));
    ctx.restore();
    return;
  }

  if (effect === 'hollow') {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = baseStrokeW;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => drawLine(line, i, 'stroke', 0, 0));
    ctx.restore();
    return;
  }

  if (effect === 'neon') {
    ctx.save();
    ctx.shadowColor = el.stroke || el.fill;
    ctx.shadowBlur = Math.max(16, el.fontSize * 0.45);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = el.fill;
    lines.forEach((line, i) => drawLine(line, i, 'fill', 0, 0));
    ctx.shadowBlur = Math.max(8, el.fontSize * 0.2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, el.fontSize * 0.03);
    lines.forEach((line, i) => drawLine(line, i, 'stroke', 0, 0));
    ctx.restore();
    return;
  }

  if (effect === 'lift') {
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.42)';
    ctx.shadowBlur = Math.max(14, el.fontSize * 0.35);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(4, el.fontSize * 0.1);
    ctx.fillStyle = el.fill;
    lines.forEach((line, i) => drawLine(line, i, 'fill', 0, 0));
    ctx.restore();
  } else {
    ctx.fillStyle = el.fill;
    lines.forEach((line, i) => drawLine(line, i, 'fill', 0, 0));
  }

  if (el.strokeWidth && el.strokeWidth > 0) {
    ctx.save();
    ctx.strokeStyle = el.stroke || '#000000';
    ctx.lineWidth = el.strokeWidth;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => drawLine(line, i, 'stroke', 0, 0));
    ctx.restore();
  }
}

export function drawStyledText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  ctx.save();
  ctx.font = buildFontString(el);
  ctx.textBaseline = 'top';

  const curve = el.curve ?? 0;
  if (Math.abs(curve) >= 1) {
    drawCurvedText(ctx, el, curve);
    ctx.restore();
    return;
  }

  const lines = wrapLines(ctx, el.text || '', el.width, el.letterSpacing);
  const lineStep = el.fontSize * el.lineHeight;

  const drawLine = (line: string, lineIdx: number, mode: 'fill' | 'stroke', dx: number, dy: number) => {
    const lineW = measureWithSpacing(ctx, line, el.letterSpacing);
    let x = 0;
    if (el.align === 'center') x = (el.width - lineW) / 2;
    else if (el.align === 'right') x = el.width - lineW;
    const y = lineIdx * lineStep;
    drawGlyphRun(ctx, line, x + dx, y + dy, el.letterSpacing, mode);
  };

  renderPass(ctx, el, drawLine, lines);
  ctx.restore();
}

function drawCurvedText(ctx: CanvasRenderingContext2D, el: TextElement, curveDeg: number): void {
  const cleanText = (el.text || '').replace(/\n+/g, ' ');
  if (!cleanText) return;

  const totalTextWidth = Math.max(1, measureWithSpacing(ctx, cleanText, el.letterSpacing));
  const arcRad = (Math.max(-320, Math.min(320, curveDeg)) * Math.PI) / 180;
  const radius = totalTextWidth / Math.abs(arcRad);
  const cx = el.width / 2;
  const downward = curveDeg > 0;
  const cy = downward ? el.fontSize + radius : el.height / 2 - radius;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const drawArc = (mode: 'fill' | 'stroke', dx: number, dy: number) => {
    const startAngle = downward ? -Math.PI / 2 - arcRad / 2 : Math.PI / 2 + arcRad / 2;
    let cursor = 0;
    for (let i = 0; i < cleanText.length; i += 1) {
      const ch = cleanText[i];
      const chW = ctx.measureText(ch).width;
      const charCenter = cursor + chW / 2;
      const fraction = charCenter / totalTextWidth;
      const angle = downward ? startAngle + fraction * Math.abs(arcRad) : startAngle - fraction * Math.abs(arcRad);

      ctx.save();
      ctx.translate(cx + dx + radius * Math.cos(angle), cy + dy + radius * Math.sin(angle));
      ctx.rotate(downward ? angle + Math.PI / 2 : angle - Math.PI / 2);
      if (mode === 'fill') ctx.fillText(ch, 0, 0);
      else ctx.strokeText(ch, 0, 0);
      ctx.restore();

      cursor += chW + el.letterSpacing;
    }
  };

  renderPass(ctx, el, (_line, _idx, mode, dx, dy) => drawArc(mode, dx, dy), [cleanText]);
}
