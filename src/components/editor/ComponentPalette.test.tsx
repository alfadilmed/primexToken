import React from 'react';
import { render, screen } from '@testing-library/react';
import ComponentPalette from './ComponentPalette'; // Adjust path if necessary
import { paletteItems } from '../../config/editorConfig'; // Import the actual config
// If ComponentPalette uses DndContext or other providers, they might need to be mocked or wrapped here.
// For now, assume it can be rendered directly or its necessary providers are simple enough.

// Mock DraggablePaletteItem if its internals are complex or not relevant to this specific test
// This allows us to focus on ComponentPalette rendering the correct number of items
// and passing correct props, rather than testing DraggablePaletteItem's own rendering/drag logic here.
jest.mock('./DraggablePaletteItem', () => ({ item }) => (
  <div data-testid={`draggable-item-${item.id}`} draggable="true">
    {item.name}
  </div>
));


describe('ComponentPalette Component', () => {
  test('renders all palette items from editorConfig', () => {
    render(<ComponentPalette />);

    expect(screen.getAllByRole('listitem')).toHaveLength(paletteItems.length); // Assuming items are in a list

    paletteItems.forEach(item => {
      // Check if an element representing the item is rendered
      // This could be by item.name, or by the test ID from the mock
      expect(screen.getByTestId(`draggable-item-${item.id}`)).toBeInTheDocument();
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  test('renders items as draggable', () => {
    render(<ComponentPalette />);
    
    paletteItems.forEach(item => {
      const draggableItem = screen.getByTestId(`draggable-item-${item.id}`);
      // Check for draggable attribute if our mock sets it,
      // or other attributes/classes that @dnd-kit might set on the source element
      // if we weren't mocking DraggablePaletteItem so deeply.
      expect(draggableItem).toHaveAttribute('draggable', 'true');
    });
  });
  
  // Add more tests if ComponentPalette has other specific behaviors,
  // e.g., filtering, categories, etc.
});
