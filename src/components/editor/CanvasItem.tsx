import React from 'react';
import { useDraggable, DragOverlay } from '@dnd-kit/core'; // DragOverlay might not be needed here, but useDraggable is key
import { CSS } from '@dnd-kit/utilities';
import { ICanvasComponent } from '../../types/editor';

interface CanvasItemProps {
  component: ICanvasComponent;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const CanvasItem: React.FC<CanvasItemProps> = ({ component, onSelect, isSelected }) => {
  // Draggable setup for the main component (for moving)
  const {
    attributes: moveAttributes,
    listeners: moveListeners,
    setNodeRef: setMoveNodeRef,
    transform: moveTransform,
    isDragging: isMoveDragging,
  } = useDraggable({ 
    id: component.id, // Main component drag ID
    data: { type: 'move', componentId: component.id } // Add data to distinguish type of drag
  });

  // Draggable setup for the resize handle
  const resizeHandleId = `resize-${component.id}`;
  const {
    attributes: resizeAttributes,
    listeners: resizeListeners,
    setNodeRef: setResizeNodeRef,
    // transform: resizeTransform, // Transform for handle itself usually not needed if positioned relative
    isDragging: isResizeDragging,
  } = useDraggable({
    id: resizeHandleId, // Unique ID for the resize handle
    data: { type: 'resize', componentId: component.id } // Add data
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,  // Apply width
    height: component.height, // Apply height
    transform: CSS.Translate.toString(moveTransform),
    opacity: isMoveDragging || isResizeDragging ? 0.8 : 1,
    border: isSelected ? '2px solid #3B82F6' : '1px solid #ccc',
    backgroundColor: 'white',
    cursor: 'grab', // For moving
    // padding: '8px', // Padding might interfere with precise w/h, apply to inner content if needed
    zIndex: isMoveDragging || isResizeDragging ? 1000 : 1,
    boxSizing: 'border-box', // Ensure border/padding are included in width/height
  };
  
  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-5px', // Position slightly outside or overlap
    right: '-5px',
    width: '10px',
    height: '10px',
    backgroundColor: '#3B82F6',
    border: '1px solid white',
    borderRadius: '2px',
    cursor: 'nwse-resize', // Resize cursor for bottom-right
    zIndex: 1001, // Above the component itself
  };

  // Basic rendering based on type
  const renderComponentContent = () => {
    // Apply padding here if needed, so width/height apply to the outer box
    const contentStyle: React.CSSProperties = { padding: '8px', width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' };
    switch (component.type) {
      case 'TextBlock':
        return <div style={contentStyle}><p style={{ fontSize: `${component.properties.fontSize}px`, color: component.properties.color }}>{component.properties.text || 'Text Block'}</p></div>;
      case 'ButtonComponent':
        return <div style={contentStyle}><button className="p-2 text-white rounded w-full h-full" style={{ backgroundColor: component.properties.backgroundColor, color: component.properties.textColor }}>{component.properties.label || 'Button'}</button></div>;
      case 'ConnectWalletButton':
        return (
          <div style={contentStyle}>
            <button className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full h-full">
              {component.properties.buttonText || 'Connect Wallet'}
            </button>
          </div>
        );
      case 'NetworkDisplay':
        return (
          <div style={contentStyle}>
            <p className="text-sm text-gray-600">
              {component.properties.prefixText || 'Current Network: '}
              <span className="font-semibold">[Network Name]</span>
            </p>
          </div>
        );
      case 'BalanceDisplay':
        const decimals = component.properties.displayDecimals || 4;
        const placeholderBalance = `0.${'0'.repeat(decimals)}`;
        const tokenName = component.properties.tokenAddress ? "Token" : "ETH";
        return (
          <div style={contentStyle}>
            <p className="text-md">
              {component.properties.label || 'Balance: '}
              <span className="font-bold">{placeholderBalance} {tokenName}</span>
            </p>
          </div>
        );
      default:
        return <div style={contentStyle}>Unknown component: {component.name}</div>;
    }
  };

  return (
    <div 
      ref={setMoveNodeRef} 
      style={style} 
      // Move listeners are on the main body for dragging the whole component
      // onClick is also on the main body for selection
      onClick={(e) => { 
        e.stopPropagation(); 
        onSelect(component.id);
      }}
    >
      {/* Apply move listeners to a specific drag handle IF you don't want the whole item draggable */}
      {/* For now, assuming the whole item is draggable for moving via `moveListeners` on this div */}
      <div {...moveAttributes} {...moveListeners} style={{width: '100%', height: '100%'}}> {/* Make entire item draggable for move */}
        {renderComponentContent()}
      </div>
      
      {isSelected && (
        <div
          ref={setResizeNodeRef}
          style={resizeHandleStyle}
          {...resizeAttributes}
          {...resizeListeners}
          onClick={(e) => e.stopPropagation()} // Prevent selection click
          onMouseDown={(e) => e.stopPropagation()} // Prevent move drag start
        />
      )}
    </div>
  );
};
export default CanvasItem;
