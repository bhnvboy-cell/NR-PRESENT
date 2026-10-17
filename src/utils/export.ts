import Konva from 'konva';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';
import {
  DEFAULT_SLIDE_SIZE,
  type Slide,
  type SlideSize,
  type CanvasElement,
  type ImageElement,
  type ShapeElement,
  type TextElement,
} from '../types/editor';
import { backgroundToKonva } from './background';
import { buildImageFilters } from './filters';
import { cropRect } from './imageCrop';
import { linePoints, polygonPoints } from './geometry';
import { drawChart } from './chart';
import { drawTable } from './table';
import type { ChartElement, TableElement } from '../types/editor';

function applyCommon(node: Konva.Node, el: CanvasElement): void {
  node.position({ x: el.x, y: el.y });
  node.rotation(el.rotation);
  node.opacity(el.opacity);
  if (el.shadow.enabled) {
    node.setAttrs({
      shadowEnabled: true,
      shadowColor: el.shadow.color,
      shadowBlur: el.shadow.blur,
      shadowOffsetX: el.shadow.offsetX,
      shadowOffsetY: el.shadow.offsetY,
      shadowOpacity: el.shadow.opacity,
    });
  }
}

function buildText(el: TextElement): Konva.Text {
  const node = new Konva.Text({
    text: el.text,
    width: el.width,
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontStyle: el.italic ? 'italic' : 'normal',
    fontWeight: el.fontWeight,
    fill: el.fill,
    align: el.align,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    textDecoration: el.decoration === 'none' ? undefined : el.decoration,
    wrap: 'word',
  });
  applyCommon(node, el);
  return node;
}

function buildShape(el: ShapeElement): Konva.Shape | Konva.Line | Konva.Arrow {
  if (el.shape === 'rect') {
    const node = new Konva.Rect({
      width: el.width,
      height: el.height,
      fill: el.fill,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
      cornerRadius: el.cornerRadius,
      lineJoin: 'round',
    });
    applyCommon(node, el);
    return node;
  }
  if (el.shape === 'ellipse') {
    const node = new Konva.Ellipse({
      radiusX: el.width / 2,
      radiusY: el.height / 2,
      offsetX: el.width / 2,
      offsetY: el.height / 2,
      fill: el.fill,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
    });
    applyCommon(node, el);
    return node;
  }
  if (el.shape === 'line') {
    const node = new Konva.Line({
      points: linePoints(el.width, el.height),
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
      lineCap: 'round',
    });
    applyCommon(node, el);
    return node;
  }
  if (el.shape === 'arrow') {
    const node = new Konva.Arrow({
      points: linePoints(el.width, el.height),
      fill: el.stroke,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
    });
    applyCommon(node, el);
    return node;
  }
  // Polygonal / star shapes.
  const pts = polygonPoints(el.shape, el.width, el.height);
  const node = new Konva.Shape({
    sceneFunc: (ctx, shape) => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(pts[i], pts[i + 1]);
      }
      ctx.closePath();
      ctx.fillStrokeShape(shape);
    },
    fill: el.fill,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    lineJoin: 'round',
  });
  applyCommon(node, el);
  return node;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

async function buildImage(el: ImageElement): Promise<Konva.Image> {
  const img = await loadImage(el.src);
  const crop = cropRect(el, { width: img.naturalWidth, height: img.naturalHeight });
  const node = new Konva.Image({
    image: img,
    width: el.width,
    height: el.height,
    cornerRadius: el.cornerRadius,
    crop,
  });
  const { filter, config } = buildImageFilters(el.filters);
  if (filter.length > 0) {
    node.setAttrs({ ...config, filters: filter } as Konva.ImageConfig);
    node.cache({});
  }
  applyCommon(node, el);
  return node;
}

function buildChart(el: ChartElement): Konva.Shape {
  const node = new Konva.Shape({
    width: el.width,
    height: el.height,
    sceneFunc: (ctx: unknown) => {
      const raw = (ctx as { _context: CanvasRenderingContext2D })._context;
      drawChart(raw, el);
    },
  });
  applyCommon(node, el);
  return node;
}

function buildTable(el: TableElement): Konva.Shape {
  const totalW = el.colWidths.reduce((a, b) => a + b, 0);
  const totalH = el.rowHeights.reduce((a, b) => a + b, 0);
  const node = new Konva.Shape({
    width: totalW,
    height: totalH,
    sceneFunc: (ctx: unknown) => {
      const raw = (ctx as { _context: CanvasRenderingContext2D })._context;
      drawTable(raw, el);
    },
  });
  applyCommon(node, el);
  return node;
}

export interface RenderOptions {
  pixelRatio?: number;
  width?: number;
  height?: number;
}

/** Render a single slide to an offscreen Konva stage and return a PNG data URL. */
export async function renderSlideToDataURL(
  slide: Slide,
  options: RenderOptions = {},
): Promise<string> {
  const width = options.width ?? DEFAULT_SLIDE_SIZE.width;
  const height = options.height ?? DEFAULT_SLIDE_SIZE.height;
  const pixelRatio = options.pixelRatio ?? 2;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  document.body.appendChild(container);

  const stage = new Konva.Stage({ container, width, height });
  const layer = new Konva.Layer();
  stage.add(layer);

  const bg = new Konva.Rect({ width, height, listening: false });
  bg.setAttrs(backgroundToKonva(slide.backgroundFill, width, height));
  layer.add(bg);

  for (const el of slide.elements) {
    if (el.hidden) continue;
    let node: Konva.Node;
    if (el.type === 'text') node = buildText(el);
    else if (el.type === 'shape') node = buildShape(el);
    else if (el.type === 'chart') node = buildChart(el);
    else if (el.type === 'table') node = buildTable(el);
    else node = await buildImage(el);
    layer.add(node as Konva.Shape);
  }

  layer.batchDraw();
  // Small delay lets Konva finish rasterizing filters/caches.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const dataUrl = stage.toDataURL({ pixelRatio, mimeType: 'image/png' });

  stage.destroy();
  container.remove();
  return dataUrl;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportSlidePng(
  slide: Slide,
  projectName: string,
  index: number,
  size: SlideSize = DEFAULT_SLIDE_SIZE,
): Promise<void> {
  const dataUrl = await renderSlideToDataURL(slide, { pixelRatio: 2, width: size.width, height: size.height });
  const safe = slug(projectName);
  downloadDataUrl(dataUrl, `${safe}-slide-${index + 1}.png`);
}

export async function exportAllSlidesPng(
  slides: Slide[],
  projectName: string,
  size: SlideSize = DEFAULT_SLIDE_SIZE,
): Promise<void> {
  const safe = slug(projectName);
  for (let i = 0; i < slides.length; i += 1) {
    const dataUrl = await renderSlideToDataURL(slides[i], {
      pixelRatio: 2,
      width: size.width,
      height: size.height,
    });
    downloadDataUrl(dataUrl, `${safe}-slide-${i + 1}.png`);
    // Yield so the browser can flush each download.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

export async function exportDeckPdf(
  slides: Slide[],
  projectName: string,
  size: SlideSize = DEFAULT_SLIDE_SIZE,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: size.width >= size.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [size.width, size.height],
    compress: true,
  });

  for (let i = 0; i < slides.length; i += 1) {
    const dataUrl = await renderSlideToDataURL(slides[i], {
      pixelRatio: 2,
      width: size.width,
      height: size.height,
    });
    if (i > 0) pdf.addPage([size.width, size.height], size.width >= size.height ? 'landscape' : 'portrait');
    pdf.addImage(dataUrl, 'PNG', 0, 0, size.width, size.height, undefined, 'FAST');
  }

  pdf.save(`${slug(projectName)}.pdf`);
}

/** Slide pages interleaved with speaker-notes handout pages. */
export async function exportDeckPdfWithNotes(
  slides: Slide[],
  projectName: string,
  size: SlideSize = DEFAULT_SLIDE_SIZE,
): Promise<void> {
  const orientation = size.width >= size.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [size.width, size.height],
    compress: true,
  });

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    const dataUrl = await renderSlideToDataURL(slide, {
      pixelRatio: 2,
      width: size.width,
      height: size.height,
    });
    if (i > 0) pdf.addPage([size.width, size.height], orientation);
    pdf.addImage(dataUrl, 'PNG', 0, 0, size.width, size.height, undefined, 'FAST');

    pdf.addPage([size.width, size.height], orientation);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text(`${projectName} — slide ${i + 1}/${slides.length}`, 60, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.text(slide.name || 'Slide', 60, 120);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(60, 140, size.width - 60, 140);
    pdf.setFontSize(14);
    const notes = slide.notes?.trim();
    const lines = pdf.splitTextToSize(notes || 'No speaker notes for this slide.', size.width - 120);
    pdf.text(lines as string[], 60, 180);
  }

  pdf.save(`${slug(projectName)}-with-notes.pdf`);
}

/** PowerPoint (.pptx) export — one full-bleed PNG per slide, speaker notes preserved. */
export async function exportDeckPptx(
  slides: Slide[],
  projectName: string,
  size: SlideSize = DEFAULT_SLIDE_SIZE,
): Promise<void> {
  const pptx = new pptxgen();
  // Fit the slide aspect inside a 13.333 x 7.5 in (widescreen) canvas.
  const maxW = 13.333;
  const maxH = 7.5;
  const aspect = size.width / size.height;
  const pageW = aspect >= maxW / maxH ? maxW : maxH * aspect;
  const pageH = aspect >= maxW / maxH ? maxW / aspect : maxH;
  pptx.defineLayout({ name: 'NR_SLIDE', width: pageW, height: pageH });
  pptx.layout = 'NR_SLIDE';
  pptx.author = 'NR Presentation';
  pptx.title = projectName;

  for (const source of slides) {
    const dataUrl = await renderSlideToDataURL(source, {
      pixelRatio: 2,
      width: size.width,
      height: size.height,
    });
    const slide = pptx.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: pageW, h: pageH });
    if (source.notes?.trim()) slide.addNotes(source.notes.trim());
  }

  await pptx.writeFile({ fileName: `${slug(projectName)}.pptx` });
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'presentation'
  );
}
