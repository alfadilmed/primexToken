import React, { useState } from 'react';
import ComponentPalette from '../../components/editor/ComponentPalette';
import Canvas from '../../components/editor/Canvas';
import PropertiesPanel from '../../components/editor/PropertiesPanel';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core'; // Added DragStartEvent
import { ICanvasComponent, IPaletteItem } from '../../types/editor';
import { useEditorHistory, EditorCanvasState } from '../hooks/useEditorHistory';
import { snapToGridValue, getHorizontalAlignmentGuides, getVerticalAlignmentGuides, Rect, Guide } from '../utils/editorMath';
// import { arrayMove } from '@dnd-kit/sortable'; // Not used for free-form drag
import { v4 as uuidv4 } from 'uuid';
import { paletteItems } from '../../config/editorConfig';
import { useLocation } from 'react-router-dom';

const Editor: React.FC = () => {
  const location = useLocation();
  
  const initialCanvasState: EditorCanvasState = (() => {
    const templateData = location.state?.templateEditorData as ICanvasComponent[] | undefined;
    if (templateData && Array.isArray(templateData)) {
      return templateData.map(component => ({
        ...component,
        id: uuidv4(),
        x: component.x || 0, 
        y: component.y || 0,
      }));
    }
    return [];
  })();

  const { 
    currentState: canvasComponents, 
    setCurrentState: setCanvasComponentsWithHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useEditorHistory(initialCanvasState);

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Grid and snapping states
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [alignmentTolerance] = useState(5);
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]); // State for active guides

  const handleSelectComponent = (id: string) => {
    setSelectedComponentId(id);
    setActiveGuides([]); // Clear guides when selecting a component
  };

  const handlePropertyChange = (componentId: string, propertyName: string, newValue: any) => {
    const newCanvasComponents = canvasComponents.map(component => {
        if (component.id === componentId) {
          return { ...component, properties: { ...component.properties, [propertyName]: newValue } };
        }
        return component;
      });
    setCanvasComponentsWithHistory(newCanvasComponents);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveGuides([]); // Clear guides when a new drag starts
    // Optionally, if you want to de-select component on drag start:
    // setSelectedComponentId(null); 
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta, activatorEvent } = event;
    const DEFAULT_WIDTH = 100; // Fallback width for new components or those without width prop
    const DEFAULT_HEIGHT = 50;  // Fallback height
    const currentActiveGuides: Guide[] = []; // Store guides that caused a snap for this drag

    // Scenario 1: Dragging from Palette to Canvas
    if (over && over.id === 'canvas-droppable-area' && active.id.toString().startsWith('palette-')) {
      const paletteItemData = active.data.current as Omit<IPaletteItem, 'id'> & { componentType: string };
      if (paletteItemData) {
        let initialX = 0;
        let initialY = 0;

        const canvasNodeRect = (over.node as HTMLElement)?.getBoundingClientRect();
        if (canvasNodeRect && (activatorEvent instanceof MouseEvent || activatorEvent instanceof TouchEvent)) {
           const clientX = activatorEvent instanceof MouseEvent ? activatorEvent.clientX : activatorEvent.touches[0].clientX;
           const clientY = activatorEvent instanceof MouseEvent ? activatorEvent.clientY : activatorEvent.touches[0].clientY;
           initialX = clientX - canvasNodeRect.left;
           initialY = clientY - canvasNodeRect.top;
        } else {
           initialX = 50 + (canvasComponents.length % 10) * (gridSize / 2); 
           initialY = 50 + (canvasComponents.length % 10) * (gridSize / 2);
        }
        
        const newComponentWidth = paletteItemData.defaultProperties.width || DEFAULT_WIDTH;
        const newComponentHeight = paletteItemData.defaultProperties.height || DEFAULT_HEIGHT;

        if (snapToGuides) {
          const draggedRect: Rect = { x: initialX, y: initialY, width: newComponentWidth, height: newComponentHeight };
          const staticRects: Rect[] = canvasComponents.map(c => ({
            x: c.x, y: c.y,
            width: c.properties.width || DEFAULT_WIDTH,
            height: c.properties.height || DEFAULT_HEIGHT,
          }));

          const hGuides = getHorizontalAlignmentGuides(draggedRect, staticRects, alignmentTolerance);
          const vGuides = getVerticalAlignmentGuides(draggedRect, staticRects, alignmentTolerance);

          let closestHGuide: Guide | null = null;
          let minHDist = alignmentTolerance + 1; 
          hGuides.forEach(guide => {
            if (guide.snapOffset !== undefined && Math.abs(guide.snapOffset) < minHDist) {
              minHDist = Math.abs(guide.snapOffset);
              closestHGuide = guide;
            }
          });

          let closestVGuide: Guide | null = null;
          let minVDist = alignmentTolerance + 1;
          vGuides.forEach(guide => {
            if (guide.snapOffset !== undefined && Math.abs(guide.snapOffset) < minVDist) {
              minVDist = Math.abs(guide.snapOffset);
              closestVGuide = guide;
            }
          });

          if (closestHGuide && closestHGuide.snapOffset !== undefined) {
            initialY -= closestHGuide.snapOffset;
            currentActiveGuides.push(closestHGuide);
          }
          if (closestVGuide && closestVGuide.snapOffset !== undefined) {
            initialX -= closestVGuide.snapOffset;
            currentActiveGuides.push(closestVGuide);
          }
        }
        
        if (snapToGrid) {
          initialX = snapToGridValue(initialX, gridSize);
          initialY = snapToGridValue(initialY, gridSize);
        }

        const newComponent: ICanvasComponent = {
          id: uuidv4(),
          type: paletteItemData.componentType,
          name: paletteItemData.name,
          x: initialX,
          y: initialY,
          properties: { ...paletteItemData.defaultProperties, width: newComponentWidth, height: newComponentHeight }, // Ensure width/height are part of props
        };
        setCanvasComponentsWithHistory([...canvasComponents, newComponent]);
      }
    }
    // Scenario 2: Moving an existing component on the Canvas
    else if (active && !active.id.toString().startsWith('palette-') && delta && over) {
      const activeId = active.id as string;
      
      setCanvasComponentsWithHistory(
        canvasComponents.map(component => {
          if (component.id === activeId) {
            let newX = component.x + delta.x;
            let newY = component.y + delta.y;

            if (snapToGuides) {
              const draggedRect: Rect = {
                x: newX, y: newY,
                width: component.properties.width || DEFAULT_WIDTH,
                height: component.properties.height || DEFAULT_HEIGHT,
              };
              const staticRects: Rect[] = canvasComponents
                .filter(c => c.id !== activeId)
                .map(c => ({
                  x: c.x, y: c.y,
                  width: c.properties.width || DEFAULT_WIDTH,
                  height: c.properties.height || DEFAULT_HEIGHT,
                }));
              
              const hGuides = getHorizontalAlignmentGuides(draggedRect, staticRects, alignmentTolerance);
              const vGuides = getVerticalAlignmentGuides(draggedRect, staticRects, alignmentTolerance);
              
              let closestHGuide: Guide | null = null;
              let minHDist = alignmentTolerance + 1;
              hGuides.forEach(guide => {
                if (guide.snapOffset !== undefined && Math.abs(guide.snapOffset) < minHDist) {
                  minHDist = Math.abs(guide.snapOffset);
                  closestHGuide = guide;
                }
              });

              let closestVGuide: Guide | null = null;
              let minVDist = alignmentTolerance + 1;
              vGuides.forEach(guide => {
                if (guide.snapOffset !== undefined && Math.abs(guide.snapOffset) < minVDist) {
                  minVDist = Math.abs(guide.snapOffset);
                  closestVGuide = guide;
                }
              });

              if (closestHGuide && closestHGuide.snapOffset !== undefined) {
                newY -= closestHGuide.snapOffset;
                currentActiveGuides.push(closestHGuide);
              }
              if (closestVGuide && closestVGuide.snapOffset !== undefined) {
                newX -= closestVGuide.snapOffset;
                currentActiveGuides.push(closestVGuide);
              }
            }

            if (snapToGrid) {
              newX = snapToGridValue(newX, gridSize);
              newY = snapToGridValue(newY, gridSize);
            }
            
            return { ...component, x: newX, y: newY };
          }
          return component;
        })
      );
    }
    setActiveGuides(currentActiveGuides); // Set active guides for rendering
    // Consider clearing guides after a short timeout if they should only be temporarily visible
    // setTimeout(() => setActiveGuides([]), 1000); // Example: clear after 1 second
  };

  const handleCanvasClick = () => {
    setSelectedComponentId(null);
    setActiveGuides([]); // Also clear guides when clicking canvas background
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex flex-col h-screen">
        <div className="p-2 border-b flex items-center space-x-4">
          <div>
            <button 
              onClick={undo} 
              disabled={!canUndo} 
              className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              Undo
            </button>
            <button 
              onClick={redo} 
              disabled={!canRedo}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              Redo
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="showGridCheckbox" className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="showGridCheckbox"
                checked={showGrid} 
                onChange={e => setShowGrid(e.target.checked)} 
                className="mr-1"
              />
              Show Grid
            </label>
            <label htmlFor="snapToGridCheckbox" className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="snapToGridCheckbox"
                checked={snapToGrid} 
                onChange={e => setSnapToGrid(e.target.checked)} 
                className="mr-1"
              />
              Snap to Grid
            </label>
            <label htmlFor="snapToGuidesCheckbox" className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="snapToGuidesCheckbox"
                checked={snapToGuides} 
                onChange={e => setSnapToGuides(e.target.checked)} 
                className="mr-1"
              />
              Snap to Guides
            </label>
            <label htmlFor="gridSizeInput" className="flex items-center">
              Grid Size:
              <input 
                type="number" 
                id="gridSizeInput"
                value={gridSize} 
                onChange={e => setGridSize(Math.max(5, Number(e.target.value)))}
                className="ml-1 w-16 p-1 border rounded"
                style={{ width: '60px' }} 
              />
              <span className="ml-1">px</span>
            </label>
          </div>
        </div>
        <div className="flex flex-grow overflow-hidden">
          <div className="w-64 h-full overflow-y-auto">
            <ComponentPalette />
          </div>
          <div className="flex-grow h-full overflow-y-auto">
            <Canvas
              canvasComponents={canvasComponents}
              selectedComponentId={selectedComponentId}
              onSelectComponent={handleSelectComponent}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              activeGuides={activeGuides} // Pass active guides to Canvas
              onCanvasClick={handleCanvasClick} // Pass handler for canvas background click
            />
          </div>
          <div className="w-72 h-full overflow-y-auto">
            <PropertiesPanel
              selectedComponentId={selectedComponentId}
              canvasComponents={canvasComponents}
              onPropertyChange={handlePropertyChange}
              paletteItems={paletteItems}
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default Editor;
