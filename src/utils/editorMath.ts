// At the top of the file, or where types are usually defined:
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Guide {
  type: 'horizontal' | 'vertical';
  position: number; // y for horizontal, x for vertical
  start: number;    // x1 for horizontal, y1 for vertical
  end: number;      // x2 for horizontal, y2 for vertical
  snapOffset?: number; // Optional: offset from draggedRect edge to guide, for precise snapping
}

/**
 * Calculates the snapped coordinate to a grid.
 * @param coordinate The current coordinate (e.g., x or y).
 * @param gridSize The size of each grid cell.
 * @returns The new coordinate snapped to the nearest grid line.
 */
export const snapToGridValue = (coordinate: number, gridSize: number): number => {
  if (gridSize <= 0) return coordinate; // Avoid division by zero or negative grid size
  return Math.round(coordinate / gridSize) * gridSize;
};

/**
 * Calculates potential horizontal alignment guides.
 * Compares top, middle, and bottom edges of the draggedRect against staticRects.
 * @param draggedRect The bounding box of the component being dragged.
 * @param staticRects An array of bounding boxes for other components on the canvas.
 * @param tolerance Pixel tolerance for snapping.
 * @returns An array of detected Guide objects.
 */
export const getHorizontalAlignmentGuides = (
  draggedRect: Rect,
  staticRects: Rect[],
  tolerance: number = 5
): Guide[] => {
  const guides: Guide[] = [];
  const draggedCenterY = draggedRect.y + draggedRect.height / 2;

  staticRects.forEach(staticRect => {
    const staticCenterY = staticRect.y + staticRect.height / 2;

    // Top edge alignment
    if (Math.abs(draggedRect.y - staticRect.y) <= tolerance) {
      guides.push({ type: 'horizontal', position: staticRect.y, 
                    start: Math.min(draggedRect.x, staticRect.x), 
                    end: Math.max(draggedRect.x + draggedRect.width, staticRect.x + staticRect.width),
                    snapOffset: draggedRect.y - staticRect.y });
    }
    // Middle Y alignment
    if (Math.abs(draggedCenterY - staticCenterY) <= tolerance) {
      guides.push({ type: 'horizontal', position: staticCenterY, 
                    start: Math.min(draggedRect.x, staticRect.x), 
                    end: Math.max(draggedRect.x + draggedRect.width, staticRect.x + staticRect.width),
                    snapOffset: draggedCenterY - staticCenterY });
    }
    // Bottom edge alignment
    if (Math.abs((draggedRect.y + draggedRect.height) - (staticRect.y + staticRect.height)) <= tolerance) {
      guides.push({ type: 'horizontal', position: staticRect.y + staticRect.height, 
                    start: Math.min(draggedRect.x, staticRect.x), 
                    end: Math.max(draggedRect.x + draggedRect.width, staticRect.x + staticRect.width),
                    snapOffset: (draggedRect.y + draggedRect.height) - (staticRect.y + staticRect.height) });
    }
  });
  return guides;
};

/**
 * Calculates potential vertical alignment guides.
 * Compares left, middle, and right edges of the draggedRect against staticRects.
 * @param draggedRect The bounding box of the component being dragged.
 * @param staticRects An array of bounding boxes for other components on the canvas.
 * @param tolerance Pixel tolerance for snapping.
 * @returns An array of detected Guide objects.
 */
export const getVerticalAlignmentGuides = (
  draggedRect: Rect,
  staticRects: Rect[],
  tolerance: number = 5
): Guide[] => {
  const guides: Guide[] = [];
  const draggedCenterX = draggedRect.x + draggedRect.width / 2;

  staticRects.forEach(staticRect => {
    const staticCenterX = staticRect.x + staticRect.width / 2;

    // Left edge alignment
    if (Math.abs(draggedRect.x - staticRect.x) <= tolerance) {
      guides.push({ type: 'vertical', position: staticRect.x, 
                    start: Math.min(draggedRect.y, staticRect.y), 
                    end: Math.max(draggedRect.y + draggedRect.height, staticRect.y + staticRect.height),
                    snapOffset: draggedRect.x - staticRect.x });
    }
    // Middle X alignment
    if (Math.abs(draggedCenterX - staticCenterX) <= tolerance) {
      guides.push({ type: 'vertical', position: staticCenterX, 
                    start: Math.min(draggedRect.y, staticRect.y), 
                    end: Math.max(draggedRect.y + draggedRect.height, staticRect.y + staticRect.height),
                    snapOffset: draggedCenterX - staticCenterX });
    }
    // Right edge alignment
    if (Math.abs((draggedRect.x + draggedRect.width) - (staticRect.x + staticRect.width)) <= tolerance) {
      guides.push({ type: 'vertical', position: staticRect.x + staticRect.width, 
                    start: Math.min(draggedRect.y, staticRect.y), 
                    end: Math.max(draggedRect.y + draggedRect.height, staticRect.y + staticRect.height),
                    snapOffset: (draggedRect.x + draggedRect.width) - (staticRect.x + staticRect.width) });
    }
  });
  return guides;
};
