import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Canvas from './Canvas'; // Adjust path
import { ICanvasComponent } from '../../types/editor'; // Adjust path
// import { EditorContext } from '../../contexts/EditorContext'; // If Canvas uses a context for selection or components

// Mock CanvasItem to verify it receives correct props and to simplify Canvas tests
jest.mock('./CanvasItem', () => ({ component, isSelected, onClick }) => (
  <div 
    data-testid={`canvas-item-${component.id}`} 
    data-isselected={String(isSelected)}
    onClick={() => onClick(component.id)} // Simulate click passing component id
  >
    {component.name} - Type: {component.type}
  </div>
));

describe('Canvas Component', () => {
  const mockCanvasComponents: ICanvasComponent[] = [
    { id: 'comp1', type: 'TextBlock', name: 'My Text 1', properties: { text: 'Hello' } },
    { id: 'comp2', type: 'ButtonComponent', name: 'My Button 1', properties: { label: 'Click' } },
  ];

  const mockOnSelectComponent = jest.fn();
  const mockOnCanvasClick = jest.fn(); // If canvas itself handles deselection

  beforeEach(() => {
    mockOnSelectComponent.mockClear();
    mockOnCanvasClick.mockClear();
  });

  test('renders all components from the canvasComponents prop', () => {
    render(
      <Canvas
        canvasComponents={mockCanvasComponents}
        selectedComponentId={null}
        onSelectComponent={mockOnSelectComponent}
        onCanvasClick={mockOnCanvasClick} 
        // Pass other required props like onComponentDragStop, onPropertyChange if Canvas itself handles them
        // For this test, focusing on rendering and selection.
        onComponentDragStop={() => {}} // Dummy prop
        onPropertyChange={() => {}}   // Dummy prop
      />
    );

    expect(screen.getAllByTestId(/canvas-item-/)).toHaveLength(mockCanvasComponents.length);
    mockCanvasComponents.forEach(comp => {
      expect(screen.getByTestId(`canvas-item-${comp.id}`)).toBeInTheDocument();
      expect(screen.getByText(`${comp.name} - Type: ${comp.type}`)).toBeInTheDocument();
    });
  });

  test('passes isSelected correctly to CanvasItem when a component is selected', () => {
    const selectedId = mockCanvasComponents[0].id;
    render(
      <Canvas
        canvasComponents={mockCanvasComponents}
        selectedComponentId={selectedId}
        onSelectComponent={mockOnSelectComponent}
        onCanvasClick={mockOnCanvasClick}
        onComponentDragStop={() => {}}
        onPropertyChange={() => {}}
      />
    );

    mockCanvasComponents.forEach(comp => {
      const itemElement = screen.getByTestId(`canvas-item-${comp.id}`);
      expect(itemElement.getAttribute('data-isselected')).toBe(String(comp.id === selectedId));
    });
  });

  test('calls onSelectComponent when a CanvasItem is clicked', () => {
    render(
      <Canvas
        canvasComponents={mockCanvasComponents}
        selectedComponentId={null}
        onSelectComponent={mockOnSelectComponent}
        onCanvasClick={mockOnCanvasClick}
        onComponentDragStop={() => {}}
        onPropertyChange={() => {}}
      />
    );

    const firstItem = screen.getByTestId(`canvas-item-${mockCanvasComponents[0].id}`);
    fireEvent.click(firstItem);

    expect(mockOnSelectComponent).toHaveBeenCalledTimes(1);
    expect(mockOnSelectComponent).toHaveBeenCalledWith(mockCanvasComponents[0].id);
  });
  
  test('calls onCanvasClick when the canvas background is clicked (for deselection)', () => {
    // This assumes the Canvas has a wrapper div that handles the click for deselection.
    // The data-testid="canvas-background" would need to be on that wrapper in Canvas.tsx.
    render(
      <div data-testid="canvas-background-wrapper" onClick={mockOnCanvasClick}>
        <Canvas
          canvasComponents={mockCanvasComponents}
          selectedComponentId={mockCanvasComponents[0].id}
          onSelectComponent={mockOnSelectComponent}
          // onCanvasClick is passed to the wrapper for this test structure,
          // or Canvas itself has an outer div that calls it.
          onCanvasClick={mockOnCanvasClick} // If Canvas itself has the click handler
          onComponentDragStop={() => {}}
          onPropertyChange={() => {}}
        />
      </div>
    );
    
    // If Canvas itself has a clickable background area:
    // fireEvent.click(screen.getByTestId('canvas-main-area')); // Assuming a testid on canvas background
    // For this example, since `onCanvasClick` is a prop, we assume it's handled by a parent or wrapper.
    // If the Canvas component itself is supposed to handle the background click:
    // Modify Canvas.tsx to have a clickable background area and test that directly.
    // For now, this test is more about ensuring the prop exists and can be called.
    // Let's assume the test structure implies it's called by a wrapper or similar.
    // A more direct test would be:
    // const { container } = render(<Canvas ... onCanvasClick={mockOnCanvasClick} ... />);
    // fireEvent.click(container.firstChild); // If the first child is the clickable background
    // For now, let's assume the onCanvasClick prop is tested by the parent that uses Canvas.
    // This test might be removed if onCanvasClick is not a direct responsibility of Canvas rendering.
    // Given the current props, it implies Canvas might have its own click handler.

    // Let's simplify and assume Canvas has a div that can be clicked for this.
    // In Canvas.tsx, the outer div could have `onClick={onCanvasClick}`.
    // For the test, we'd need a test-id on that div.
    // If Canvas.tsx's root element is the clickable area:
    const { container } = render(
        <Canvas
            canvasComponents={mockCanvasComponents}
            selectedComponentId={null}
            onSelectComponent={mockOnSelectComponent}
            onCanvasClick={mockOnCanvasClick}
            onComponentDragStop={() => {}}
            onPropertyChange={() => {}}
        />
    );
    // Click the first child of the container, assuming it's the main canvas div
    if (container.firstChild) {
        fireEvent.click(container.firstChild as HTMLElement);
        expect(mockOnCanvasClick).toHaveBeenCalledTimes(1);
    }
  });

  // Drag and drop tests for Canvas would be more complex and likely involve:
  // - A DndContext wrapper if not already part of Canvas.
  // - Simulating drag events, which can be tricky with @testing-library/react alone.
  // - Often, such tests are better as E2E tests or specialized integration tests.
  // - For now, we focus on rendering and basic selection.
});
