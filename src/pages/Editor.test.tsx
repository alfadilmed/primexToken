import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Editor from './Editor';
import { DragEndEvent } from '@dnd-kit/core'; // Import the type
import { ICanvasComponent, EditorCanvasState } from '../types/editor'; // Ensure EditorCanvasState is imported
import { paletteItems } from '../config/editorConfig'; // For creating a sample palette item

// Mock child components
jest.mock('../components/editor/ComponentPalette', () => () => <div data-testid="component-palette">ComponentPalette</div>);
// Updated Canvas mock to make it easier to inspect its props, especially canvasComponents
let lastCanvasComponents: ICanvasComponent[] = [];
jest.mock('../components/editor/Canvas', () => (props: any) => {
    lastCanvasComponents = props.canvasComponents; // Capture props
    return (
        <div data-testid="canvas" data-showgrid={String(props.showGrid)} data-gridsize={String(props.gridSize)}>
            {props.canvasComponents.map((comp: ICanvasComponent) => (
                <div key={comp.id} data-testid={`item-${comp.id}`} data-x={comp.x} data-y={comp.y}>
                    {comp.name}
                </div>
            ))}
        </div>
    );
});
// jest.mock('../components/editor/PropertiesPanel', () => () => <div data-testid="properties-panel">PropertiesPanel</div>);
// New mock for PropertiesPanel
let capturedOnPropertyChange: (componentId: string, propertyName: string, newValue: any) => void = () => {};
jest.mock('../components/editor/PropertiesPanel', () => (props: any) => {
  capturedOnPropertyChange = props.onPropertyChange; // Capture the callback
  return <div data-testid="properties-panel">PropertiesPanel</div>;
});


// Mock useLocation
const mockLocationState = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: mockLocationState() }),
}));

// Mock useEditorHistory
const mockSetCurrentStateFromHistory = jest.fn();
let currentMockedHistoryState: EditorCanvasState = []; // To simulate the state within useEditorHistory
jest.mock('../hooks/useEditorHistory', () => ({
  useEditorHistory: (initialState: EditorCanvasState) => {
    currentMockedHistoryState = initialState; // Initialize with passed state
    // When setCurrentState is called by the Editor, update our mock a
    const actualSetCurrentState = (newState: EditorCanvasState) => {
        currentMockedHistoryState = newState;
        mockSetCurrentStateFromHistory(newState); // Call the jest.fn mock for assertions
    };
    return {
        currentState: currentMockedHistoryState,
        setCurrentState: actualSetCurrentState,
        undo: jest.fn(),
        redo: jest.fn(),
        canUndo: false,
        canRedo: false,
    };
  },
}));

// Mock DndContext to capture onDragEnd
let capturedOnDragEnd: (event: DragEndEvent) => void = () => {};
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode, onDragEnd: (event: DragEndEvent) => void }) => {
    capturedOnDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
}));

// Constants for minimum dimensions (should match those in Editor.tsx)
const MIN_COMPONENT_WIDTH = 20;
const MIN_COMPONENT_HEIGHT = 20;


describe('Editor Page - Drag & Snapping Interactions', () => {
  beforeEach(() => {
    mockLocationState.mockReturnValue(null);
    mockSetCurrentStateFromHistory.mockClear();
    capturedOnDragEnd = () => {}; // Reset captured handler
    capturedOnPropertyChange = () => {}; // Reset captured handler
    currentMockedHistoryState = []; // Reset state for useEditorHistory mock
    lastCanvasComponents = []; // Reset captured canvasComponents
  });

  test('existing component moved on canvas snaps to grid if snapToGrid is true', () => {
    // Initial state for useEditorHistory, which Editor will receive as canvasComponents
    const initialComponent: ICanvasComponent = { id: 'comp1', type: 'TextBlock', name: 'Test Comp', x: 7, y: 12, width: 100, height: 50, properties: {} };
    currentMockedHistoryState = [initialComponent]; // Set initial state for the hook

    render(
      <Router>
        <Editor />
      </Router>
    );

    const snapCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
    if (!snapCheckbox.checked) {
      fireEvent.click(snapCheckbox); // Ensure snapping is ON
    }
    const gridSizeInput = screen.getByLabelText(/grid size/i) as HTMLInputElement;
    fireEvent.change(gridSizeInput, { target: { value: '20' } }); // Ensure gridSize is 20

    // Create mock DragEndEvent
    const mockDragEndEvent: DragEndEvent = {
      active: { id: 'comp1', data: { current: { /* ... any other data ... */ } } },
      over: { id: 'canvas-droppable-area', data: { current: { /* ... */ } } }, // Assuming drop on canvas
      delta: { x: 15, y: 17 }, // Raw drag movement (22, 29 new raw position)
      activatorEvent: new MouseEvent('mouseup') as any, // Dummy activator event
      collisions: null,
      modifiers: null,
    };

    act(() => {
      capturedOnDragEnd(mockDragEndEvent); // Call the captured onDragEnd handler
    });

    expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
    const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
    const movedComponent = updatedComponents.find(c => c.id === 'comp1');
    
    expect(movedComponent).toBeDefined();
    // Initial: x:7, y:12. Delta: x:15, y:17. Raw new: x:22, y:29. GridSize:20.
    // Snapped: x:snapToGridValue(22, 20) = 20. y:snapToGridValue(29, 20) = 20
    expect(movedComponent?.x).toBe(20);
    expect(movedComponent?.y).toBe(20); 
  });

  test('existing component moved on canvas does NOT snap if snapToGrid is false', () => {
    const initialComponent: ICanvasComponent = { id: 'comp1', type: 'TextBlock', name: 'Test Comp', x: 7, y: 12, width: 100, height: 50, properties: {} };
    currentMockedHistoryState = [initialComponent];

    render(
      <Router>
        <Editor />
      </Router>
    );

    const snapCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
    if (snapCheckbox.checked) { // Ensure snapping is OFF
      fireEvent.click(snapCheckbox);
    }
    
    const mockDragEndEvent: DragEndEvent = {
      active: { id: 'comp1', data: { current: {} } },
      over: { id: 'canvas-droppable-area', data: { current: {} } },
      delta: { x: 15, y: 17 }, // Raw new position would be (22, 29)
      activatorEvent: new MouseEvent('mouseup') as any,
      collisions: null, modifiers: null,
    };

    act(() => {
      capturedOnDragEnd(mockDragEndEvent);
    });

    expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
    const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
    const movedComponent = updatedComponents.find(c => c.id === 'comp1');
    
    expect(movedComponent).toBeDefined();
    expect(movedComponent?.x).toBe(22); // 7 + 15
    expect(movedComponent?.y).toBe(29); // 12 + 17
  });
  
  test('new component dropped from palette snaps to grid if snapToGrid is true', () => {
    currentMockedHistoryState = []; // Start with empty canvas

    render(
      <Router>
        <Editor />
      </Router>
    );

    const snapCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
    if (!snapCheckbox.checked) {
      fireEvent.click(snapCheckbox); // Ensure snapping is ON
    }
    fireEvent.change(screen.getByLabelText(/grid size/i), { target: { value: '20' } });

    // Mock the drop event
    const mockActivatorEvent = { clientX: 125, clientY: 135 } as MouseEvent; // Example drop coords
    const mockCanvasBounds = { left: 50, top: 60, width: 500, height: 400 } as DOMRect;
    
    const mockDragEndEventForNew: DragEndEvent = {
      active: { id: 'palette-text', data: { current: paletteItems.find(p => p.id === 'text') } }, // Simulate dragging 'text' item
      over: { 
        id: 'canvas-droppable-area', 
        node: { getBoundingClientRect: () => mockCanvasBounds } as HTMLElement // Mock canvas node
      },
      delta: { x: 0, y: 0 }, // Delta not typically used for initial drop like this
      activatorEvent: mockActivatorEvent, // Key for calculating drop position
      collisions: null, modifiers: null,
    };

    act(() => {
      capturedOnDragEnd(mockDragEndEventForNew);
    });

    expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
    const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
    expect(updatedComponents.length).toBe(1);
    const newComponent = updatedComponents[0];

    // Expected initial position based on drop:
    // initialX = clientX(125) - canvasNode.left(50) = 75
    // initialY = clientY(135) - canvasNode.top(60) = 75
    // Snapped with gridSize 20:
    // snappedX = Math.round(75/20)*20 = Math.round(3.75)*20 = 4*20 = 80
    // snappedY = Math.round(75/20)*20 = 4*20 = 80
    expect(newComponent.x).toBe(80);
    expect(newComponent.y).toBe(80);
    expect(newComponent.type).toBe('TextBlock');
  });
  
  describe('Smart Guide Snapping', () => {
    const tolerance = 5; 
    const defaultCompWidth = 100;
    const defaultCompHeight = 50;

    test('snaps dragged component to vertical guide (left edge of static component)', () => {
      const staticComp: ICanvasComponent = { 
        id: 'static1', type: 'TextBlock', name: 'Static', 
        x: 150, y: 50, width: defaultCompWidth, height: defaultCompHeight, properties: {} 
      };
      const draggedCompInitial: ICanvasComponent = { 
        id: 'drag1', type: 'TextBlock', name: 'Dragged', 
        x: 10, y: 55, width: defaultCompWidth, height: defaultCompHeight, properties: {} 
      };
      currentMockedHistoryState = [staticComp, draggedCompInitial];

      render(<Router><Editor /></Router>);

      const snapToGuidesCheckbox = screen.getByLabelText(/snap to guides/i) as HTMLInputElement;
      if (!snapToGuidesCheckbox.checked) fireEvent.click(snapToGuidesCheckbox);
      
      const snapToGridCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
      if (snapToGridCheckbox.checked) fireEvent.click(snapToGridCheckbox); 

      const mockDragEndEvent: DragEndEvent = {
        active: { id: 'drag1', data: { current: {} } },
        over: { id: 'canvas-droppable-area', data: { current: {} } }, 
        delta: { x: 138, y: 2 }, // raw new x = 10 + 138 = 148 (close to 150), y = 55 + 2 = 57
        activatorEvent: new MouseEvent('mouseup') as any,
        collisions: null, modifiers: null,
      };

      act(() => {
        capturedOnDragEnd(mockDragEndEvent);
      });

      expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
      const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
      const movedComponent = updatedComponents.find(c => c.id === 'drag1');

      expect(movedComponent).toBeDefined();
      expect(movedComponent?.x).toBe(150); 
      expect(movedComponent?.y).toBe(57); 
    });

    test('snaps to grid after smart guide if both enabled and guide is not on grid line', () => {
        const staticComp: ICanvasComponent = { 
            id: 'static1', type: 'TextBlock', name: 'Static', 
            x: 148, y: 50, width: defaultCompWidth, height: defaultCompHeight, properties: {} 
        }; 
        const draggedCompInitial: ICanvasComponent = { 
            id: 'drag1', type: 'TextBlock', name: 'Dragged', 
            x: 10, y: 10, width: defaultCompWidth, height: defaultCompHeight, properties: {} 
        };
        currentMockedHistoryState = [staticComp, draggedCompInitial];

        render(<Router><Editor /></Router>);

        const snapToGuidesCheckbox = screen.getByLabelText(/snap to guides/i) as HTMLInputElement;
        if (!snapToGuidesCheckbox.checked) fireEvent.click(snapToGuidesCheckbox);
        
        const snapToGridCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
        if (!snapToGridCheckbox.checked) fireEvent.click(snapToGridCheckbox); 
        fireEvent.change(screen.getByLabelText(/grid size/i), { target: { value: '20' }});

        const mockDragEndEvent: DragEndEvent = {
            active: { id: 'drag1', data: { current: {} } },
            over: { id: 'canvas-droppable-area', data: { current: {} } },
            delta: { x: 138, y: 0 }, // raw new x = 10 + 138 = 148
            activatorEvent: new MouseEvent('mouseup') as any,
            collisions: null, modifiers: null,
        };

        act(() => {
            capturedOnDragEnd(mockDragEndEvent);
        });

        expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
        const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
        const movedComponent = updatedComponents.find(c => c.id === 'drag1');

        expect(movedComponent).toBeDefined();
        // Snapped to guide: x = 148. Then snapped to grid (20): Math.round(148/20)*20 = 7*20 = 140.
        expect(movedComponent?.x).toBe(140); 
        expect(movedComponent?.y).toBe(10);
    });
  });

  describe('Component Resizing', () => {
    test('dragging a resize handle updates width and height', () => {
      const initialComp: ICanvasComponent = { 
        id: 'comp1', type: 'TextBlock', name: 'Resizeable', 
        x: 10, y: 10, width: 100, height: 50, properties: {} 
      };
      currentMockedHistoryState = [initialComp];

      render(<Router><Editor /></Router>);
      
      const snapToGridCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
      if (snapToGridCheckbox.checked) fireEvent.click(snapToGridCheckbox);


      const resizeDragEvent: DragEndEvent = {
        active: { 
          id: `resize-${initialComp.id}`, 
          data: { current: { type: 'resize', componentId: initialComp.id } } 
        },
        over: null, 
        delta: { x: 25, y: 35 },
        activatorEvent: new MouseEvent('mouseup') as any,
        collisions: null, modifiers: null,
      };

      act(() => {
        capturedOnDragEnd(resizeDragEvent);
      });

      expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
      const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
      const resizedComponent = updatedComponents.find(c => c.id === initialComp.id);

      expect(resizedComponent).toBeDefined();
      expect(resizedComponent?.width).toBe(initialComp.width + 25);
      expect(resizedComponent?.height).toBe(initialComp.height + 35);
    });

    test('enforces minimum width and height during resize', () => {
      const initialComp: ICanvasComponent = { 
        id: 'comp1', type: 'TextBlock', name: 'ResizeableMin', 
        x: 10, y: 10, width: 30, height: 30, properties: {} 
      };
      currentMockedHistoryState = [initialComp];
      render(<Router><Editor /></Router>);
      
      const snapToGridCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
      if (snapToGridCheckbox.checked) fireEvent.click(snapToGridCheckbox);


      const resizeDragEvent: DragEndEvent = {
        active: { 
          id: `resize-${initialComp.id}`, 
          data: { current: { type: 'resize', componentId: initialComp.id } } 
        },
        over: null,
        delta: { x: -50, y: -50 }, 
        activatorEvent: new MouseEvent('mouseup') as any,
        collisions: null, modifiers: null,
      };

      act(() => {
        capturedOnDragEnd(resizeDragEvent);
      });

      expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
      const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
      const resizedComponent = updatedComponents.find(c => c.id === initialComp.id);

      expect(resizedComponent).toBeDefined();
      expect(resizedComponent?.width).toBe(MIN_COMPONENT_WIDTH);
      expect(resizedComponent?.height).toBe(MIN_COMPONENT_HEIGHT);
    });

    test('resized component snaps its bottom-right corner to grid if snapToGrid is true', () => {
        const initialComp: ICanvasComponent = { 
            id: 'comp1', type: 'TextBlock', name: 'ResizeSnap', 
            x: 10, y: 10, width: 105, height: 55, 
            properties: {} 
        };
        currentMockedHistoryState = [initialComp];
        render(<Router><Editor /></Router>);

        const snapCheckbox = screen.getByLabelText(/snap to grid/i) as HTMLInputElement;
        if (!snapCheckbox.checked) fireEvent.click(snapCheckbox); 
        fireEvent.change(screen.getByLabelText(/grid size/i), { target: { value: '20' } });

        const resizeDragEvent: DragEndEvent = {
            active: { id: `resize-${initialComp.id}`, data: { current: { type: 'resize', componentId: initialComp.id } } },
            over: null,
            delta: { x: 12, y: 12 }, 
            activatorEvent: new MouseEvent('mouseup') as any,
            collisions: null, modifiers: null,
        };

        act(() => {
            capturedOnDragEnd(resizeDragEvent);
        });
        
        expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
        const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
        const resizedComponent = updatedComponents.find(c => c.id === initialComp.id);

        expect(resizedComponent).toBeDefined();
        // Expected logic:
        // newWidth = 105 + 12 = 117; newHeight = 55 + 12 = 67
        // finalRight = snapToGridValue(10 + 117, 20) = snapToGridValue(127, 20) = 120
        // finalBottom = snapToGridValue(10 + 67, 20) = snapToGridValue(77, 20) = 80
        // finalWidth = 120 - 10 = 110
        // finalHeight = 80 - 10 = 70
        expect(resizedComponent?.width).toBe(110);
        expect(resizedComponent?.height).toBe(70);
    });
  });

  describe('Properties Panel Interaction with Editor State', () => {
    test('handlePropertyChange updates the correct component property via setCanvasComponentsWithHistory', () => {
      const initialText = 'Hello World';
      const newText = 'Hello Primex!';
      const compToChange: ICanvasComponent = {
        id: 'comp1', type: 'TextBlock', name: 'My Text', 
        x: 10, y: 10, width: 100, height: 50, 
        properties: { text: initialText, fontSize: 16 } 
      };
      const otherComp: ICanvasComponent = {
        id: 'comp2', type: 'ButtonComponent', name: 'My Button', 
        x: 50, y: 50, width: 120, height: 30, 
        properties: { label: 'Click' }
      };
      currentMockedHistoryState = [compToChange, otherComp]; // Set initial state for useEditorHistory
  
      render(<Router><Editor /></Router>);
      
      // Simulate PropertiesPanel calling onPropertyChange
      act(() => {
        capturedOnPropertyChange(compToChange.id, 'text', newText);
      });
  
      expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
      const updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
      
      const changedComponent = updatedComponents.find(c => c.id === compToChange.id);
      expect(changedComponent).toBeDefined();
      expect(changedComponent?.properties.text).toBe(newText);
      expect(changedComponent?.properties.fontSize).toBe(16); // Ensure other props are untouched
  
      const unchangedComponent = updatedComponents.find(c => c.id === otherComp.id);
      expect(unchangedComponent?.properties.text).toBeUndefined(); // Or its original value if it had one
      expect(unchangedComponent?.properties.label).toBe('Click'); // Ensure other components are untouched
    });
  
    test('handlePropertyChange updates width/height correctly and respects MIN_DIMENSIONS', () => {
      const compToResize: ICanvasComponent = {
        id: 'compResize', type: 'TextBlock', name: 'My Resizable Text',
        x: 10, y: 10, width: 100, height: 50,
        properties: { text: "some text" }
      };
      currentMockedHistoryState = [compToResize];
      render(<Router><Editor /></Router>);
  
      // Simulate PropertiesPanel changing 'width' property
      act(() => {
        capturedOnPropertyChange(compToResize.id, 'width', 10); // Attempt to set below MIN_COMPONENT_WIDTH (20)
      });
  
      expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(1);
      let updatedComponents = mockSetCurrentStateFromHistory.mock.calls[0][0] as ICanvasComponent[];
      let changedComponent = updatedComponents.find(c => c.id === compToResize.id);
      
      expect(changedComponent).toBeDefined();
      expect(changedComponent?.width).toBe(MIN_COMPONENT_WIDTH); // Should be clamped to MIN_COMPONENT_WIDTH
      expect(changedComponent?.height).toBe(50); // Height should be untouched
  
      // Simulate PropertiesPanel changing 'height' property to a valid value
      act(() => {
        capturedOnPropertyChange(compToResize.id, 'height', 75);
      });
      
      expect(mockSetCurrentStateFromHistory).toHaveBeenCalledTimes(2); // Called again
      updatedComponents = mockSetCurrentStateFromHistory.mock.calls[1][0] as ICanvasComponent[];
      changedComponent = updatedComponents.find(c => c.id === compToResize.id);
  
      expect(changedComponent).toBeDefined();
      expect(changedComponent?.width).toBe(MIN_COMPONENT_WIDTH); // Width remains from previous update
      expect(changedComponent?.height).toBe(75); 
    });
  });
});
>>>>>>> REPLACE
