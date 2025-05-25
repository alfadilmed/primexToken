import React from 'react';
// Replace useSortable with useDraggable
import { useDraggable } from '@dnd-kit/core'; 
import { CSS } from '@dnd-kit/utilities'; // Still useful for transform
import { ICanvasComponent } from '../../types/editor';

interface CanvasItemProps {
  component: ICanvasComponent; // Should now include x, y
  onSelect: (id: string) => void;
  isSelected: boolean;
  // No longer needs specific props from a SortableContext like 'id' for useSortable,
  // but useDraggable needs an id too. The component.id is fine.
}

const CanvasItem: React.FC<CanvasItemProps> = ({ component, onSelect, isSelected }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform, // This will give {x, y, scaleX, scaleY} or null
    isDragging,
  } = useDraggable({ 
    id: component.id,
    // data: can be used to pass component data if needed by DndContext handlers
  });

  const style: React.CSSProperties = {
    position: 'absolute', // Key change for free-form positioning
    left: component.x,    // Use x from component props
    top: component.y,     // Use y from component props
    transform: CSS.Translate.toString(transform), // Apply drag transform
    opacity: isDragging ? 0.8 : 1, // Visual feedback when dragging
    border: isSelected ? '2px solid #3B82F6' : '1px solid #ccc',
    backgroundColor: 'white',
    cursor: 'grab',
    padding: '8px',
    // Remove margin as positioning is absolute
    // Add any other styles like width, height if they come from component.properties
    // For example:
    // width: component.properties.width || 'auto',
    // height: component.properties.height || 'auto',
    zIndex: isDragging ? 1000 : 1, // Ensure dragged item is on top
  };

  // Basic rendering based on type (same as before)
  const renderComponent = () => {
    switch (component.type) {
      case 'TextBlock':
        return <p style={{ fontSize: `${component.properties.fontSize}px`, color: component.properties.color }}>{component.properties.text || 'Text Block'}</p>;
      case 'ButtonComponent':
        return <button className="p-2 text-white rounded" style={{ backgroundColor: component.properties.backgroundColor, color: component.properties.textColor }}>{component.properties.label || 'Button'}</button>;
      case 'ConnectWalletButton':
        return (
          <button className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {component.properties.buttonText || 'Connect Wallet'}
          </button>
        );
      case 'NetworkDisplay':
        return (
          <p className="text-sm text-gray-600">
            {component.properties.prefixText || 'Current Network: '}
            <span className="font-semibold">[Network Name]</span>
          </p>
        );
      case 'BalanceDisplay':
        const decimals = component.properties.displayDecimals || 4;
        const placeholderBalance = `0.${'0'.repeat(decimals)}`;
        const tokenName = component.properties.tokenAddress ? "Token" : "ETH";
        return (
          <p className="text-md">
            {component.properties.label || 'Balance: '}
            <span className="font-bold">{placeholderBalance} {tokenName}</span>
          </p>
        );
      default:
        return <div>Unknown component: {component.name}</div>;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={(e) => { 
        e.stopPropagation(); // Prevent canvas click when item is clicked
        onSelect(component.id);
      }}
    >
      {renderComponent()}
    </div>
  );
};
export default CanvasItem;
