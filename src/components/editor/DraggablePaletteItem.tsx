import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { IPaletteItem } from '../../types/editor'; // Adjusted path

interface DraggablePaletteItemProps {
  item: IPaletteItem;
}

const DraggablePaletteItem: React.FC<DraggablePaletteItemProps> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${item.id}`, // Prefix to distinguish from canvas items
    data: { // Pass item data to be used on drop
      type: item.componentType,
      defaultProperties: item.defaultProperties,
      name: item.name
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 mb-2 bg-white border border-gray-300 rounded shadow-sm cursor-grab active:cursor-grabbing"
    >
      {item.name}
    </div>
  );
};

export default DraggablePaletteItem;
