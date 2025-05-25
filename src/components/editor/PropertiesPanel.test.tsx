import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertiesPanel from './PropertiesPanel'; // Adjust path
import { ICanvasComponent } from '../../types/editor'; // Adjust path
import { paletteItems } from '../../config/editorConfig'; // To get propertyDefinitions

// Mock any context if PropertiesPanel relies on it to get the selected component or update functions
// Example:
// jest.mock('../../contexts/EditorContext', () => ({
//   useEditorContext: () => ({
//     selectedComponent: mockSelectedComponent, // Defined in test
//     updateComponentProperties: mockUpdateComponentProperties, // Defined in test
//   }),
// }));


describe('PropertiesPanel Component', () => {
  // Get a sample component definition from paletteItems (e.g., TextBlock)
  const textBlockDefinition = paletteItems.find(item => item.id === 'text');
  if (!textBlockDefinition) {
    throw new Error("Test setup error: TextBlock definition not found in editorConfig.");
  }

  const mockSelectedComponent: ICanvasComponent = {
    id: 'comp1',
    type: textBlockDefinition.componentType, // e.g., 'TextBlock'
    name: 'My Text Block',
    properties: { ...textBlockDefinition.defaultProperties }, // Start with default properties
  };

  const mockOnPropertyChange = jest.fn();

  beforeEach(() => {
    mockOnPropertyChange.mockClear();
  });

  test('renders nothing or a placeholder if no component is selected', () => {
    render(<PropertiesPanel selectedComponent={null} onPropertyChange={mockOnPropertyChange} />);
    // Assuming it renders some placeholder text or nothing
    const placeholder = screen.queryByText(/select a component to edit its properties/i);
    // Or check if a specific container is empty
    // For this example, let's assume a placeholder text is shown.
    // If it just renders null, then check for absence of known panel elements.
    if (placeholder) {
        expect(placeholder).toBeInTheDocument();
    } else {
        // Example: check that no input field is rendered if panel is empty
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    }
  });

  test('renders property fields based on selectedComponent's definition', () => {
    render(<PropertiesPanel selectedComponent={mockSelectedComponent} onPropertyChange={mockOnPropertyChange} />);
    
    textBlockDefinition.propertyDefinitions.forEach(propDef => {
      // Check if a label for the property is rendered
      expect(screen.getByLabelText(new RegExp(propDef.label, "i"))).toBeInTheDocument();
    });
  });

  test('displays current property values in input fields', () => {
    const customProps = { ...textBlockDefinition.defaultProperties, text: "Custom Text Value" };
    const componentWithCustomProps: ICanvasComponent = { ...mockSelectedComponent, properties: customProps };
    render(<PropertiesPanel selectedComponent={componentWithCustomProps} onPropertyChange={mockOnPropertyChange} />);

    const textInput = screen.getByLabelText(new RegExp(textBlockDefinition.propertyDefinitions.find(p => p.name === 'text')!.label, "i")) as HTMLInputElement;
    expect(textInput.value).toBe("Custom Text Value");
  });

  test('calls onPropertyChange with correct arguments when a property is changed', () => {
    render(<PropertiesPanel selectedComponent={mockSelectedComponent} onPropertyChange={mockOnPropertyChange} />);
    
    const textPropDefinition = textBlockDefinition.propertyDefinitions.find(p => p.name === 'text');
    if (!textPropDefinition) throw new Error("Text property definition not found for testing.");

    const textInput = screen.getByLabelText(new RegExp(textPropDefinition.label, "i"));
    fireEvent.change(textInput, { target: { value: 'New Text' } });

    expect(mockOnPropertyChange).toHaveBeenCalledTimes(1);
    expect(mockOnPropertyChange).toHaveBeenCalledWith(mockSelectedComponent.id, textPropDefinition.name, 'New Text');
  });

  test('handles different input types correctly (e.g., number, color)', () => {
    // Find a component with number or color type for more specific testing if needed
    // For 'textBlockDefinition' from editorConfig, 'fontSize' is a number and 'color' is a color.
    
    const fontSizePropDef = textBlockDefinition.propertyDefinitions.find(p => p.name === 'fontSize');
    if (!fontSizePropDef) throw new Error("FontSize property definition not found.");
    
    const colorPropDef = textBlockDefinition.propertyDefinitions.find(p => p.name === 'color');
    if (!colorPropDef) throw new Error("Color property definition not found.");

    render(<PropertiesPanel selectedComponent={mockSelectedComponent} onPropertyChange={mockOnPropertyChange} />);

    // Test number input
    const fontSizeInput = screen.getByLabelText(new RegExp(fontSizePropDef.label, "i"));
    fireEvent.change(fontSizeInput, { target: { value: '24' } }); // Input value is string
    expect(mockOnPropertyChange).toHaveBeenCalledWith(mockSelectedComponent.id, fontSizePropDef.name, 24); // But callback receives number

    // Test color input (assuming it's a text input for hex color)
    const colorInput = screen.getByLabelText(new RegExp(colorPropDef.label, "i"));
    fireEvent.change(colorInput, { target: { value: '#FF0000' } });
    expect(mockOnPropertyChange).toHaveBeenCalledWith(mockSelectedComponent.id, colorPropDef.name, '#FF0000');
  });
  
  test('re-renders correctly when selectedComponent changes', () => {
    const { rerender } = render(
      <PropertiesPanel selectedComponent={mockSelectedComponent} onPropertyChange={mockOnPropertyChange} />
    );
    // Verify initial render for textBlockDefinition
    expect(screen.getByLabelText(new RegExp(textBlockDefinition.propertyDefinitions.find(p=>p.name === 'text')!.label, "i"))).toBeInTheDocument();

    // Change to a different component type (e.g., Button)
    const buttonDefinition = paletteItems.find(item => item.id === 'button');
    if (!buttonDefinition) throw new Error("Button definition not found.");
    const mockButtonComponent: ICanvasComponent = {
      id: 'comp2',
      type: buttonDefinition.componentType,
      name: 'My Button',
      properties: { ...buttonDefinition.defaultProperties },
    };

    rerender(
      <PropertiesPanel selectedComponent={mockButtonComponent} onPropertyChange={mockOnPropertyChange} />
    );
    
    // Verify fields for buttonDefinition are now rendered
    expect(screen.getByLabelText(new RegExp(buttonDefinition.propertyDefinitions.find(p=>p.name === 'label')!.label, "i"))).toBeInTheDocument();
    // Verify fields for textBlockDefinition are no longer rendered (or ensure distinct labels)
    expect(screen.queryByLabelText(new RegExp(textBlockDefinition.propertyDefinitions.find(p=>p.name === 'text')!.label, "i"))).not.toBeInTheDocument();
  });
});
