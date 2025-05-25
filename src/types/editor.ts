export interface IPropertyDefinition {
  name: string; // e.g., 'text', 'label', 'fontSize'
  type: 'string' | 'number' | 'boolean' | 'color'; // Added color type
  control: 'textInput' | 'textArea' | 'checkbox' | 'numberInput' | 'colorPicker'; // Added numberInput and colorPicker
  label: string; // User-friendly label for the property panel
  defaultValue?: any; // Default value for this property
  options?: Array<{ value: string; label: string }>; // For select controls (if added later)
}

export interface IPaletteItem {
  id: string; // e.g., 'text', 'button'
  name: string; // e.g., 'Text Block', 'Button'
  componentType: string; // e.g., 'TextBlock', 'ButtonComponent'
  defaultProperties: Record<string, any>; // Initial properties when dropped
  propertyDefinitions: IPropertyDefinition[]; // Definitions for editing
}

export interface ICanvasComponent {
  id: string; // Unique instance ID
  type: string; // Matches IPaletteItem.componentType
  name: string; // User-friendly name, can be from IPaletteItem.name
  x: number;    // X coordinate on the canvas
  y: number;    // Y coordinate on the canvas
  properties: Record<string, any>; // Component-specific properties
}
