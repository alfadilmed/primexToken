import React from 'react';
import { IPaletteItem, IPropertyDefinition } from '../../types/editor'; // Adjusted path, added IPropertyDefinition
import DraggablePaletteItem from './DraggablePaletteItem';

const paletteItems: IPaletteItem[] = [
  {
    id: 'text',
    name: 'Text Block',
    componentType: 'TextBlock',
    defaultProperties: { text: 'Some default text', color: '#000000', fontSize: 16 },
    propertyDefinitions: [
      { name: 'text', type: 'string', control: 'textArea', label: 'Text Content', defaultValue: 'Some default text' },
      { name: 'color', type: 'color', control: 'colorPicker', label: 'Text Color', defaultValue: '#000000' },
      { name: 'fontSize', type: 'number', control: 'numberInput', label: 'Font Size (px)', defaultValue: 16 },
    ],
  },
  {
    id: 'button',
    name: 'Button',
    componentType: 'ButtonComponent',
    defaultProperties: { label: 'Click Me', backgroundColor: '#3B82F6', textColor: '#FFFFFF' },
    propertyDefinitions: [
      { name: 'label', type: 'string', control: 'textInput', label: 'Button Label', defaultValue: 'Click Me' },
      { name: 'backgroundColor', type: 'color', control: 'colorPicker', label: 'Background Color', defaultValue: '#3B82F6' },
      { name: 'textColor', type: 'color', control: 'colorPicker', label: 'Text Color', defaultValue: '#FFFFFF' },
      // Future: { name: 'action', type: 'string', control: 'select', label: 'Action', options: [...] }
    ],
  },
  // Add more components like Image, Container later with their respective propertyDefinitions
];

const ComponentPalette: React.FC = () => {
  return (
    <div className="bg-gray-100 p-4 h-full border-r border-gray-300 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Components</h2>
      <div>
        {paletteItems.map((item) => (
          <DraggablePaletteItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ComponentPalette;
