import React, { useState, useRef } from 'react'; // Added useRef
import ComponentPalette from '../../components/editor/ComponentPalette';
import Canvas from '../../components/editor/Canvas';
import PropertiesPanel from '../../components/editor/PropertiesPanel';
import { DndContext, DragEndEvent, DragStartEvent, DragMoveEvent, closestCenter } from '@dnd-kit/core'; // Added DragMoveEvent
import { ICanvasComponent, IPaletteItem } from '../../types/editor';
import { useEditorHistory, EditorCanvasState } from '../hooks/useEditorHistory';
import { snapToGridValue, getHorizontalAlignmentGuides, getVerticalAlignmentGuides, Rect, Guide } from '../utils/editorMath';
import { v4 as uuidv4 } from 'uuid';
import { paletteItems } from '../../config/editorConfig';
import { useLocation } from 'react-router-dom';

const MIN_COMPONENT_WIDTH = 20;
const MIN_COMPONENT_HEIGHT = 20;
const DEFAULT_NEW_COMPONENT_WIDTH = 150;
const DEFAULT_NEW_COMPONENT_HEIGHT = 50;

const Editor: React.FC = () => {
  const location = useLocation();
  // const canvasRef = useRef<HTMLDivElement>(null); // Not strictly needed for the simplified handleDragMove
  
  const initialCanvasState: EditorCanvasState = (() => {
    const templateData = location.state?.templateEditorData as ICanvasComponent[] | undefined;
    if (templateData && Array.isArray(templateData)) {
      return templateData.map(component => ({
        ...component,
        id: uuidv4(),
        x: component.x || 0, 
        y: component.y || 0,
        width: component.width || DEFAULT_NEW_COMPONENT_WIDTH,
        height: component.height || DEFAULT_NEW_COMPONENT_HEIGHT,
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

  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [alignmentTolerance] = useState(5);
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);

  const handleSelectComponent = (id: string) => {
    setSelectedComponentId(id);
    setActiveGuides([]);
  };

  const handlePropertyChange = (componentId: string, propertyName: string, newValue: any) => {
    const newCanvasComponents = canvasComponents.map(component => {
        if (component.id === componentId) {
          if (propertyName === 'width') {
            return { ...component, width: Math.max(MIN_COMPONENT_WIDTH, Number(newValue)) };
          }
          if (propertyName === 'height') {
            return { ...component, height: Math.max(MIN_COMPONENT_HEIGHT, Number(newValue)) };
          }
          return { ...component, properties: { ...component.properties, [propertyName]: newValue } };
        }
        return component;
      });
    setCanvasComponentsWithHistory(newCanvasComponents);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveGuides([]);
  };
  
  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    let currentActiveGuides: Guide[] = [];
  
    // Only calculate guides if snapToGuides is enabled and it's an existing component being moved
    if (snapToGuides && active.data.current?.type !== 'resize' && !active.id.toString().startsWith('palette-')) {
      const activeComponent = canvasComponents.find(c => c.id === active.id);
  
      if (activeComponent) { 
        const currentX = activeComponent.x + delta.x; // Approximate current position
        const currentY = activeComponent.y + delta.y;
  
        const draggedRect: Rect = {
          x: currentX,
          y: currentY,
          width: activeComponent.width,
          height: activeComponent.height,
        };
  
        const staticRects: Rect[] = canvasComponents
          .filter(c => c.id !== active.id)
          .map(c => ({ x: c.x, y: c.y, width: c.width, height: c.height }));
      
        const hGuides = getHorizontalAlignmentGuides(draggedRect, staticRects, alignmentTolerance);
        const vGuides = getVerticalAlignmentGuides(draggedRect, staticRects, alignmentTolerance);
        currentActiveGuides.push(...hGuides, ...vGuides);
      }
    }
    setActiveGuides(currentActiveGuides);
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta, activatorEvent } = event;
    // Use the guides calculated during the last handleDragMove for final snapping
    const finalActiveGuidesForOperation: Guide[] = [...activeGuides]; 
    setActiveGuides([]); // Clear for next drag operation

    // Check if this is a resize operation
    if (active.data.current?.type === 'resize') {
      const componentId = active.data.current.componentId as string;
      
      setCanvasComponentsWithHistory(
        canvasComponents.map(component => {
          if (component.id === componentId) {
            let newWidth = component.width + delta.x;
            let newHeight = component.height + delta.y;

            newWidth = Math.max(MIN_COMPONENT_WIDTH, newWidth);
            newHeight = Math.max(MIN_COMPONENT_HEIGHT, newHeight);
            
            if (snapToGrid) { 
              let finalRight = component.x + newWidth;
              let finalBottom = component.y + newHeight;

              finalRight = snapToGridValue(finalRight, gridSize);
              finalBottom = snapToGridValue(finalBottom, gridSize);
              
              newWidth = Math.max(MIN_COMPONENT_WIDTH, finalRight - component.x);
              newHeight = Math.max(MIN_COMPONENT_HEIGHT, finalBottom - component.y);
            }

            return { ...component, width: newWidth, height: newHeight };
          }
          return component;
        })
      );
      return; 
    }

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
        
        const newComponentWidth = paletteItemData.defaultProperties?.width || DEFAULT_NEW_COMPONENT_WIDTH;
        const newComponentHeight = paletteItemData.defaultProperties?.height || DEFAULT_NEW_COMPONENT_HEIGHT;
        
        const newProperties = { ...paletteItemData.defaultProperties };
        delete newProperties.width;
        delete newProperties.height;

        if (snapToGuides) {
          // For new components, guides are calculated based on initial drop, not live during drag from palette.
          // So, we re-calculate guides here for the final drop position.
          const draggedRect: Rect = { x: initialX, y: initialY, width: newComponentWidth, height: newComponentHeight };
          const staticRects: Rect[] = canvasComponents.map(c => ({
            x: c.x, y: c.y,
            width: c.width, 
            height: c.height,
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
            // finalActiveGuidesForOperation.push(closestHGuide); // Not needed here as handleDragMove sets them
          }
          if (closestVGuide && closestVGuide.snapOffset !== undefined) {
            initialX -= closestVGuide.snapOffset;
            // finalActiveGuidesForOperation.push(closestVGuide);
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
          width: newComponentWidth, 
          height: newComponentHeight,
          properties: newProperties,
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
              // Use guides that were active at the end of the move (from finalActiveGuidesForOperation before clearing)
              const hGuidesToSnap = finalActiveGuidesForOperation.filter(g => g.type === 'horizontal');
              const vGuidesToSnap = finalActiveGuidesForOperation.filter(g => g.type === 'vertical');
              
              let closestHGuide: Guide | null = null;
              let minHDist = alignmentTolerance + 1;
              hGuidesToSnap.forEach(guide => {
                 // The snapOffset is how far the current position (newX, newY) is from the guide.
                 // We need to adjust newY by this offset.
                const currentDraggedY = component.y + delta.y; // Position before any snapping in this step
                const distToGuideEdge = currentDraggedY - (guide.position - (guide.snapOffset || 0));
                 if (Math.abs(distToGuideEdge) < minHDist) { // Check if this guide is the closest one for the current axis
                     minHDist = Math.abs(distToGuideEdge);
                     closestHGuide = guide;
                 }
              });

              let closestVGuide: Guide | null = null;
              let minVDist = alignmentTolerance + 1;
              vGuidesToSnap.forEach(guide => {
                const currentDraggedX = component.x + delta.x; // Position before any snapping in this step
                 if (Math.abs(currentDraggedX - (guide.position - (guide.snapOffset || 0))) < minVDist ) {
                     minVDist = Math.abs(currentDraggedX - (guide.position - (guide.snapOffset || 0)));
                     closestVGuide = guide;
                }
              });
              
              if (closestHGuide && closestHGuide.snapOffset !== undefined) {
                // Apply the offset that was determined during dragMove
                // newY is the position *after* guide snapping has been applied in handleDragMove
                // So, if a guide was active, newY (from handleDragMove's perspective) was already adjusted.
                // Here, we're taking component.y + delta.y (raw final position) and re-applying the snap based on the *closest* guide found during move.
                newY = component.y + delta.y - closestHGuide.snapOffset;
              }
              if (closestVGuide && closestVGuide.snapOffset !== undefined) {
                newX = component.x + delta.x - closestVGuide.snapOffset;
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
    // setActiveGuides(finalActiveGuidesForOperation); // This line was for populating guides at end, now handled by handleDragMove
  };
  
  const handleCanvasClick = () => {
    setSelectedComponentId(null);
    setActiveGuides([]);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
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
          <div className="flex-grow h-full overflow-y-auto"> {/* Removed canvasRef from here */}
            <Canvas
              canvasComponents={canvasComponents}
              selectedComponentId={selectedComponentId}
              onSelectComponent={handleSelectComponent}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              activeGuides={activeGuides}
              onCanvasClick={handleCanvasClick}
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
