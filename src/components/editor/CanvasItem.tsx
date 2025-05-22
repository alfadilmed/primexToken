import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ICanvasComponent } from '../../types/editor';

interface CanvasItemProps {
  component: ICanvasComponent;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const CanvasItem: React.FC<CanvasItemProps> = ({ component, onSelect, isSelected }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Useful for styling the dragged item
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // Add some margin/padding for visual separation
    padding: '8px',
    margin: '4px 0',
    border: isSelected ? '2px solid #3B82F6' : '1px solid #ccc', // Blue border if selected
    backgroundColor: 'white',
    cursor: 'grab',
  };

  // Basic rendering based on type
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
        const tokenName = component.properties.tokenAddress ? "Token" : "ETH"; // Basic placeholder
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
      onClick={() => onSelect(component.id)}
    >
      {renderComponent()}
    </div>
  );
};
export default CanvasItem;
