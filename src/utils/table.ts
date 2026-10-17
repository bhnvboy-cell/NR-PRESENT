import type { TableElement } from '../types/editor';

/**
 * Draw a table into a Konva SceneContext. Shared by the live canvas node and the
 * offline export renderer so tables export identically to how they appear.
 */
export function drawTable(ctx: CanvasRenderingContext2D, table: TableElement): void {
  const { colWidths, rowHeights, cells } = table;
  ctx.save();

  let y = 0;
  for (let r = 0; r < table.rows; r += 1) {
    const rowH = rowHeights[r] ?? 44;
    let x = 0;
    for (let c = 0; c < table.cols; c += 1) {
      const colW = colWidths[c] ?? 140;
      const isHeader = r === 0;
      const fill = isHeader
        ? table.headerFill
        : r % 2 === 0
          ? table.altFill
          : table.bodyFill;

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, colW, rowH);

      // Border
      ctx.strokeStyle = table.borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, colW - 1, rowH - 1);

      // Text
      const text = cells[r]?.[c] ?? '';
      ctx.fillStyle = isHeader ? table.headerText : table.bodyText;
      ctx.font = `${isHeader ? 600 : 400} ${isHeader ? table.headerFontSize : table.fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const padX = 12;
      const clipped = clipText(ctx, text, colW - padX * 2);
      ctx.fillText(clipped, x + padX, y + rowH / 2);

      x += colW;
    }
    y += rowH;
  }

  ctx.restore();
}

function clipText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

/** Total rendered size of the table given its width/height arrays. */
export function tableSize(table: TableElement): { width: number; height: number } {
  const width = table.colWidths.reduce((a, b) => a + b, 0);
  const height = table.rowHeights.reduce((a, b) => a + b, 0);
  return { width, height };
}
