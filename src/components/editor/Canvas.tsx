import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ICanvasComponent } from '../../types/editor';
import { Guide } from '../../utils/editorMath'; // Import Guide from editorMath
import CanvasItem from './CanvasItem';

interface CanvasProps {
  canvasComponents: ICanvasComponent[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  showGrid: boolean;
  snapToGrid: boolean; // Though not directly used for rendering guides, it's part of overall context
  gridSize: number;
  onCanvasClick?: () => void;
  activeGuides?: Guide[]; // New prop for rendering guide lines
}

const Canvas: React.FC<CanvasProps> = ({ 
  canvasComponents, 
  selectedComponentId, 
  onSelectComponent,
  showGrid,
  gridSize,
  onCanvasClick,
  activeGuides = [] // Default to empty array
}) => {
  const { setNodeRef: droppableCanvasRef, isOver } = useDroppable({
    id: 'canvas-droppable-area',
  });

  const canvasBaseStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',   
    height: '100%',  
    overflow: 'auto',
  };

  if (showGrid) {
    canvasBaseStyle.backgroundImage = `
      linear-gradient(to right, #e0e0e0 1px, transparent 1px),
      linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
    `;
    canvasBaseStyle.backgroundSize = `${gridSize}px ${gridSize}px`;
  }

  return (
    <div
      className={`bg-white p-4 h-full flex-grow overflow-y-auto relative`} 
    >
      <h2 className="text-lg font-semibold mb-4">Canvas</h2>
      <p className="text-sm text-gray-600 mb-4">Drop components here to build your UI. Drag to move.</p>
      <div 
        ref={droppableCanvasRef}
        className={`border-2 border-dashed border-gray-400 min-h-[calc(100%-80px)] ${isOver ? 'bg-blue-100' : 'bg-gray-50'}`}
        style={canvasBaseStyle}
        onClick={onCanvasClick}
      >
        {canvasComponents.map(component => (
          <CanvasItem
            key={component.id}
            component={component}
            onSelect={onSelectComponent}
            isSelected={component.id === selectedComponentId}
          />
        ))}

        {/* Render Active Guides */}
        {activeGuides.map((guide, index) => {
          const guideStyle: React.CSSProperties = {
            position: 'absolute',
            backgroundColor: 'rgba(255, 0, 0, 0.7)', // Red, slightly transparent
            zIndex: 500, // Ensure guides are visible but below dragged items if necessary
          };
          if (guide.type === 'horizontal') {
            guideStyle.top = `${guide.position}px`;
            guideStyle.left = `${guide.start}px`; // Use guide's start/end for length
            guideStyle.width = `${guide.end - guide.start}px`;
            guideStyle.height = '1px';
          } else { // Vertical
            guideStyle.left = `${guide.position}px`;
            guideStyle.top = `${guide.start}px`; // Use guide's start/end for length
            guideStyle.height = `${guide.end - guide.start}px`;
            guideStyle.width = '1px';
          }
          return <div key={`guide-${index}`} style={guideStyle} data-testid={`guide-${guide.type}`} />;
        })}

        {canvasComponents.length === 0 && !isOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-center">
              Canvas is empty. Drag components from the left panel.
            </p>
          </div>
        )}
        {isOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-100 bg-opacity-50">
                <p className="text-blue-600 font-semibold text-center">Release to drop component</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
