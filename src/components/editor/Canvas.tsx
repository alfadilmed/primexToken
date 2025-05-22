import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ICanvasComponent } from '../../types/editor';
import CanvasItem from './CanvasItem';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface CanvasProps {
  canvasComponents: ICanvasComponent[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void; // Renamed for clarity from handleSelectComponent
}

const Canvas: React.FC<CanvasProps> = ({ canvasComponents, selectedComponentId, onSelectComponent }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable-area',
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white p-4 h-full flex-grow ${isOver ? 'bg-blue-100' : ''} overflow-y-auto relative`} // Added relative for absolute positioning of placeholder text
    >
      <h2 className="text-lg font-semibold mb-4">Canvas</h2>
      <p className="text-sm text-gray-600 mb-4">Drop components here to build your UI. Drag to reorder.</p>
      <div className="border-2 border-dashed border-gray-400 min-h-[calc(100%-80px)] p-4"> {/* Adjusted min-height slightly */}
        <SortableContext 
          items={canvasComponents.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {canvasComponents.map(component => (
            <CanvasItem
              key={component.id}
              component={component}
              onSelect={onSelectComponent}
              isSelected={component.id === selectedComponentId}
            />
          ))}
        </SortableContext>
        {canvasComponents.length === 0 && !isOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-center">
              Canvas is empty. Drag components from the left panel.
            </p>
          </div>
        )}
        {isOver && ( // Show "Release to drop" if over canvas, regardless of items
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-100 bg-opacity-50">
                <p className="text-blue-600 font-semibold text-center">
                    Release to drop component
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
