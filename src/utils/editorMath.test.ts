import { snapToGridValue, getHorizontalAlignmentGuides, getVerticalAlignmentGuides, Rect } from './editorMath'; // Added Rect

describe('editorMath utilities', () => {
  describe('snapToGridValue', () => {
    it('should snap to the nearest grid line', () => {
      expect(snapToGridValue(23, 20)).toBe(20);
      expect(snapToGridValue(37, 20)).toBe(40);
      expect(snapToGridValue(10, 20)).toBe(20); // Math.round(0.5) is 1, so 1*20 = 20
      expect(snapToGridValue(0, 20)).toBe(0);
      expect(snapToGridValue(19.9, 20)).toBe(20);
    });

    it('should not snap if gridSize is 0 or less', () => {
      expect(snapToGridValue(23, 0)).toBe(23);
      expect(snapToGridValue(23, -10)).toBe(23);
    });

    it('should handle coordinates already on grid lines', () => {
      expect(snapToGridValue(40, 20)).toBe(40);
    });
  });

  describe('getHorizontalAlignmentGuides', () => {
    const dragged: Rect = { x: 10, y: 10, width: 50, height: 50 }; // Ends at y=60

    it('should find no guides if staticRects is empty', () => {
      expect(getHorizontalAlignmentGuides(dragged, [])).toEqual([]);
    });

    it('should detect top edge alignment', () => {
      const staticItems: Rect[] = [{ x: 100, y: 12, width: 50, height: 50 }]; // y=12 is within tolerance of y=10
      const guides = getHorizontalAlignmentGuides(dragged, staticItems, 3);
      expect(guides).toContainEqual(expect.objectContaining({ type: 'horizontal', position: 12, snapOffset: -2 }));
    });

    it('should detect middle Y alignment', () => {
      // draggedCenterY = 10 + 25 = 35
      // staticItem y=5, h=50 -> staticCenterY = 5+25 = 30. Within tolerance.
      const staticItemsAligned: Rect[] = [{ x: 100, y: 5, width: 50, height: 50 }]; 
      const guides = getHorizontalAlignmentGuides(dragged, staticItemsAligned, 5);
      expect(guides).toContainEqual(expect.objectContaining({ type: 'horizontal', position: 30, snapOffset: 5 }));
    });

    it('should detect bottom edge alignment', () => {
      // draggedBottom = 10 + 50 = 60
      const staticItems: Rect[] = [{ x: 100, y: 10, width: 50, height: 48 }]; // staticBottom = 10 + 48 = 58. Within tolerance.
      const guides = getHorizontalAlignmentGuides(dragged, staticItems, 3);
      expect(guides).toContainEqual(expect.objectContaining({ type: 'horizontal', position: 58, snapOffset: 2 }));
    });

    it('should not detect alignment if outside tolerance', () => {
      const staticItems: Rect[] = [{ x: 100, y: 20, width: 50, height: 50 }]; // y=20 is > 3 away from y=10
      expect(getHorizontalAlignmentGuides(dragged, staticItems, 3)).toEqual([]);
    });
  });

  describe('getVerticalAlignmentGuides', () => {
    const dragged: Rect = { x: 10, y: 10, width: 50, height: 50 }; // Ends at x=60

    it('should find no guides if staticRects is empty', () => {
      expect(getVerticalAlignmentGuides(dragged, [])).toEqual([]);
    });

    it('should detect left edge alignment', () => {
      const staticItems: Rect[] = [{ x: 12, y: 100, width: 50, height: 50 }]; // x=12 is within tolerance of x=10
      const guides = getVerticalAlignmentGuides(dragged, staticItems, 3);
      expect(guides).toContainEqual(expect.objectContaining({ type: 'vertical', position: 12, snapOffset: -2 }));
    });
    
    it('should detect middle X alignment', () => {
      // draggedCenterX = 10 + 25 = 35
      const staticItemsAligned: Rect[] = [{ x: 5, y: 100, width: 50, height: 50 }]; // staticCenterX = 5+25=30. Within tolerance.
      const guides = getVerticalAlignmentGuides(dragged, staticItemsAligned, 5);
      expect(guides).toContainEqual(expect.objectContaining({ type: 'vertical', position: 30, snapOffset: 5 }));
    });

    it('should detect right edge alignment', () => {
      // draggedRight = 10 + 50 = 60
      const staticItems: Rect[] = [{ x: 10, y: 100, width: 48, height: 50 }]; // staticRight = 10 + 48 = 58. Within tolerance.
      const guides = getVerticalAlignmentGuides(dragged, staticItems, 3);
      expect(guides).toContainEqual(expect.objectContaining({ type: 'vertical', position: 58, snapOffset: 2 }));
    });
  });
});
