import React from 'react';
import { ICanvasComponent, IPaletteItem, IPropertyDefinition } from '../../types/editor'; // Adjusted paths

interface PropertiesPanelProps {
  selectedComponentId: string | null;
  canvasComponents: ICanvasComponent[];
  onPropertyChange: (componentId: string, propertyName: string, newValue: any) => void;
  paletteItems: IPaletteItem[]; // To look up propertyDefinitions
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponentId,
  canvasComponents,
  onPropertyChange,
  paletteItems,
}) => {
  const selectedComponent = canvasComponents.find(c => c.id === selectedComponentId);

  if (!selectedComponent) {
    return (
      <div className="bg-gray-100 p-4 h-full border-l border-gray-300 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <p className="text-gray-500">Select a component on the canvas to see its properties.</p>
      </div>
    );
  }

  // Find the corresponding palette item to get propertyDefinitions
  const componentDefinition = paletteItems.find(pItem => pItem.componentType === selectedComponent.type);

  const handleInputChange = (propDef: IPropertyDefinition, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value: any = e.target.value;
    if (propDef.type === 'number') {
      value = parseFloat(value);
      if (isNaN(value)) value = propDef.defaultValue !== undefined ? propDef.defaultValue : 0; // Fallback for invalid number
    } else if (propDef.type === 'boolean') {
      // This case is for hypothetical future checkbox, current inputs are text/number/color
      value = (e.target as HTMLInputElement).checked;
    }
    onPropertyChange(selectedComponent.id, propDef.name, value);
  };
  
  const handleColorChange = (propDef: IPropertyDefinition, e: React.ChangeEvent<HTMLInputElement>) => {
    onPropertyChange(selectedComponent.id, propDef.name, e.target.value);
  };


  return (
    <div className="bg-gray-100 p-4 h-full border-l border-gray-300 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Properties</h2>
      <div>
        <div className="mb-2">
          <span className="font-medium">ID:</span> {selectedComponent.id}
        </div>
        <div className="mb-2">
          <span className="font-medium">Type:</span> {selectedComponent.type}
        </div>
        <div className="mb-2">
          <span className="font-medium">Name:</span> {selectedComponent.name}
        </div>
        <hr className="my-3"/>
        <h3 className="text-md font-semibold mb-2">Component Properties:</h3>
        {!componentDefinition && <p className="text-red-500">Property definitions not found for this component type.</p>}
        {componentDefinition && componentDefinition.propertyDefinitions.map((propDef) => {
          const currentValue = selectedComponent.properties[propDef.name] !== undefined 
                               ? selectedComponent.properties[propDef.name] 
                               : propDef.defaultValue;
          return (
            <div key={propDef.name} className="mb-3">
              <label htmlFor={`${selectedComponent.id}-${propDef.name}`} className="block text-sm font-medium text-gray-700 capitalize">
                {propDef.label}
              </label>
              {propDef.control === 'textInput' && (
                <input
                  type="text"
                  id={`${selectedComponent.id}-${propDef.name}`}
                  value={String(currentValue)}
                  onChange={(e) => handleInputChange(propDef, e)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              )}
              {propDef.control === 'textArea' && (
                <textarea
                  id={`${selectedComponent.id}-${propDef.name}`}
                  value={String(currentValue)}
                  onChange={(e) => handleInputChange(propDef, e)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              )}
              {propDef.control === 'numberInput' && (
                <input
                  type="number"
                  id={`${selectedComponent.id}-${propDef.name}`}
                  value={String(currentValue)} // Input type number still takes string value
                  onChange={(e) => handleInputChange(propDef, e)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              )}
              {propDef.control === 'colorPicker' && (
                 <input
                  type="color"
                  id={`${selectedComponent.id}-${propDef.name}`}
                  value={String(currentValue)}
                  onChange={(e) => handleColorChange(propDef, e)}
                  className="mt-1 block w-full h-10 px-1 py-1 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
              {/* Add other controls like checkbox later */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertiesPanel;
