import { useState, useCallback } from 'react';

// Define a generic type for the editor's canvas state.
// This should match the actual structure of your canvas content.
// For example, if it's an array of ICanvasComponent from src/types/editor.ts:
import { ICanvasComponent } from '../types/editor'; // Adjust path as necessary
export type EditorCanvasState = ICanvasComponent[]; // Example type

interface HistoryState {
  past: EditorCanvasState[];
  present: EditorCanvasState;
  future: EditorCanvasState[];
}

const MAX_HISTORY_LENGTH = 50; // Max number of undo steps

export interface UseEditorHistoryReturn {
  currentState: EditorCanvasState;
  setCurrentState: (newState: EditorCanvasState, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // clearHistory: () => void; // Optional: for resetting history
}

/**
 * Custom hook to manage undo/redo history for the editor canvas state.
 * @param initialState The initial state of the editor canvas.
 */
export const useEditorHistory = (initialState: EditorCanvasState): UseEditorHistoryReturn => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: [],
  });

  const setCurrentState = useCallback((newState: EditorCanvasState, skipHistory: boolean = false) => {
    setHistory(currentHistory => {
      if (newState === currentHistory.present) {
        return currentHistory; // No change, no need to update history
      }
      if (skipHistory) { // Used for undo/redo actions themselves, or for non-history state updates
        return {
          ...currentHistory,
          present: newState,
        };
      }
      // When a new state is set, clear the future (redo stack)
      const newPast = [...currentHistory.past, currentHistory.present].slice(-MAX_HISTORY_LENGTH);
      return {
        past: newPast,
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      if (past.length === 0) {
        return currentHistory; // Nothing to undo
      }
      const previousState = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previousState,
        future: [present, ...future].slice(0, MAX_HISTORY_LENGTH), // Add current state to future
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      if (future.length === 0) {
        return currentHistory; // Nothing to redo
      }
      const nextState = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present].slice(-MAX_HISTORY_LENGTH), // Add current state to past
        present: nextState,
        future: newFuture,
      };
    });
  }, []);
  
  // Optional: function to clear history
  // const clearHistory = useCallback(() => {
  //   setHistory(currentHistory => ({
  //     past: [],
  //     present: currentHistory.present, // Or reset to initialState if desired
  //     future: [],
  //   }));
  // }, []);


  return {
    currentState: history.present,
    setCurrentState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    // clearHistory,
  };
};

// Example usage (conceptual, would be in your Editor component):
// const MyEditor = () => {
//   const initialCanvasState: EditorCanvasState = []; // Your editor's initial state
//   const { currentState, setCurrentState, undo, redo, canUndo, canRedo } = useEditorHistory(initialCanvasState);
//
//   const handleAddComponent = (component: ICanvasComponent) => {
//     const newState = [...currentState, component];
//     setCurrentState(newState);
//   };
//
//   const handlePropertyChange = (componentId: string, newProps: any) => {
//     const newState = currentState.map(comp => 
//       comp.id === componentId ? { ...comp, properties: newProps } : comp
//     );
//     setCurrentState(newState);
//   };
//
//   return (
//     <div>
//       <button onClick={undo} disabled={!canUndo}>Undo</button>
//       <button onClick={redo} disabled={!canRedo}>Redo</button>
//       {/* Render canvas based on currentState */}
//     </div>
//   );
// };
