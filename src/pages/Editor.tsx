import React from 'react';

import React, { useState } from 'react';
import ComponentPalette from '../../components/editor/ComponentPalette';
import Canvas from '../../components/editor/Canvas';
import PropertiesPanel from '../../components/editor/PropertiesPanel';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { ICanvasComponent } from '../../types/editor'; // Adjusted path

import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { ICanvasComponent, IPaletteItem } from '../../types/editor';
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is imported
import { paletteItems } from '../../config/editorConfig';
import { useLocation } from 'react-router-dom'; // Import useLocation

const Editor: React.FC = () => {
  const location = useLocation();
  const [canvasComponents, setCanvasComponents] = useState<ICanvasComponent[]>(() => {
    const templateData = location.state?.templateEditorData as ICanvasComponent[] | undefined;
    if (templateData && Array.isArray(templateData)) {
      // Regenerate IDs for components from template
      return templateData.map(component => ({
        ...component,
        id: uuidv4(),
      }));
    }
    return []; // Default to empty if no template data
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const handleSelectComponent = (id: string) => {
    setSelectedComponentId(id);
  };

  const handlePropertyChange = (componentId: string, propertyName: string, newValue: any) => {
    setCanvasComponents(prevComponents =>
      prevComponents.map(component => {
        if (component.id === componentId) {
          return {
            ...component,
            properties: {
              ...component.properties,
              [propertyName]: newValue,
            },
          };
        }
        return component;
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Scenario 1: Dragging from Palette to Canvas
    if (over && over.id === 'canvas-droppable-area' && active.id.toString().startsWith('palette-')) {
      const paletteItemData = active.data.current as Omit<IPaletteItem, 'id'> & { componentType: string }; // Type assertion
      if (paletteItemData) {
        const newComponent: ICanvasComponent = {
          id: uuidv4(), // Generate unique ID
          type: paletteItemData.componentType,
          name: paletteItemData.name,
          properties: { ...paletteItemData.defaultProperties },
        };
        setCanvasComponents((prev) => [...prev, newComponent]);
      }
      return;
    }

    // Scenario 2: Reordering within Canvas
    // Ensure 'over' is not null and we are not dragging a palette item over another canvas item (which shouldn't happen with current setup)
    if (over && active.id !== over.id && !active.id.toString().startsWith('palette-') && !over.id.toString().startsWith('palette-') && over.id !== 'canvas-droppable-area' ) {
      setCanvasComponents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id); // 'over.id' should be the ID of a sortable canvas item
        
        if (oldIndex === -1 || newIndex === -1) return items; // Should not happen if IDs are correct

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    // Using closestCenter for better collision detection with multiple items
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex flex-col h-screen">
        {/* Optional: Editor specific header or toolbar can go here */}
        <div className="flex flex-grow overflow-hidden">
          <div className="w-64 h-full overflow-y-auto">
            <ComponentPalette />
          </div>
          <div className="flex-grow h-full overflow-y-auto">
            <Canvas
              canvasComponents={canvasComponents}
              selectedComponentId={selectedComponentId}
              onSelectComponent={handleSelectComponent}
            />
          </div>
          <div className="w-72 h-full overflow-y-auto">
            <PropertiesPanel
              selectedComponentId={selectedComponentId}
              canvasComponents={canvasComponents}
              onPropertyChange={handlePropertyChange}
              paletteItems={paletteItems} // Pass paletteItems
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default Editor;
