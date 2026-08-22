import type { OcrTextBox } from './types';

/**
 * Spatial post-processor for vertical / mixed-orientation text (blueprint §8.2).
 *
 * Placards frequently print room numbers vertically. OCR detection returns a set of
 * character boxes whose *reading order* is not implied by the box index. This module
 * reconstructs the correct string:
 *
 *   - Boxes whose X-center coordinates are within `threshold` are treated as a single
 *     vertical column and sorted by ascending Y (top-to-bottom).
 *   - Columns are then ordered left-to-right.
 */

export const VERTICAL_X_THRESHOLD = 0.15;

function centerX(box: OcrTextBox): number {
  return box.bbox.x + box.bbox.width / 2;
}

function centerY(box: OcrTextBox): number {
  return box.bbox.y + box.bbox.height / 2;
}

/** True when two boxes share the same vertical axis (within threshold). */
export function areVerticallyAligned(
  a: OcrTextBox,
  b: OcrTextBox,
  threshold: number = VERTICAL_X_THRESHOLD,
): boolean {
  return Math.abs(centerX(a) - centerX(b)) <= threshold;
}

/** Group boxes into vertical columns based on X-axis proximity. */
export function groupIntoColumns(
  boxes: OcrTextBox[],
  threshold: number = VERTICAL_X_THRESHOLD,
): OcrTextBox[][] {
  const columns: OcrTextBox[][] = [];
  const sortedByX = [...boxes].sort((a, b) => centerX(a) - centerX(b));

  for (const box of sortedByX) {
    const column = columns.find((c) => areVerticallyAligned(c[0], box, threshold));
    if (column) {
      column.push(box);
    } else {
      columns.push([box]);
    }
  }
  return columns;
}

/**
 * Sort boxes into natural reading order:
 * each vertical column is sorted top-to-bottom, columns are sorted left-to-right.
 */
export function sortByReadingOrder(boxes: OcrTextBox[]): OcrTextBox[] {
  if (boxes.length <= 1) return [...boxes];

  const columns = groupIntoColumns(boxes);
  for (const column of columns) {
    column.sort((a, b) => centerY(a) - centerY(b));
  }
  columns.sort((a, b) => centerX(a[0]) - centerX(b[0]));

  return columns.flat();
}

/** Reconstruct a single string from detected boxes in reading order. */
export function reconstructText(boxes: OcrTextBox[]): string {
  return sortByReadingOrder(boxes)
    .map((box) => box.text)
    .join('');
}
