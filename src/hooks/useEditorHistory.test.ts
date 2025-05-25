import { act, renderHook } from '@testing-library/react';
import { useEditorHistory, EditorCanvasState } from './useEditorHistory'; // Adjust path

describe('useEditorHistory Hook', () => {
  const initialState: EditorCanvasState = [{ id: 'comp1', type: 'TextBlock', name: 'Initial Text', properties: { text: 'Hello' } }];
  const stateA: EditorCanvasState = [{ id: 'comp1', type: 'TextBlock', name: 'Initial Text', properties: { text: 'State A' } }];
  const stateB: EditorCanvasState = [{ id: 'comp1', type: 'TextBlock', name: 'Initial Text', properties: { text: 'State B' } }];
  const stateC: EditorCanvasState = [{ id: 'comp1', type: 'TextBlock', name: 'Initial Text', properties: { text: 'State C' } }];

  test('should initialize with the initial state', () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    expect(result.current.currentState).toEqual(initialState);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  test('setCurrentState should update the present state and clear future', () => {
    const { result } = renderHook(() => useEditorHistory(initialState));

    act(() => {
      result.current.setCurrentState(stateA);
    });
    expect(result.current.currentState).toEqual(stateA);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false); // Future should be cleared

    // Add another state to ensure future is cleared after a previous undo
    act(() => {
      result.current.undo(); // Back to initialState
    });
     act(() => {
      result.current.setCurrentState(stateB); // New state after undo
    });
    expect(result.current.currentState).toEqual(stateB);
    expect(result.current.canUndo).toBe(true); // initialState is in past
    expect(result.current.canRedo).toBe(false); // Future is cleared
  });
  
  test('setCurrentState with skipHistory should update present but not affect history', () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    act(() => {
      result.current.setCurrentState(stateA); // This goes into history
    });
    act(() => {
      result.current.setCurrentState(stateB, true); // This should skip history
    });

    expect(result.current.currentState).toEqual(stateB);
    expect(result.current.canUndo).toBe(true); // Still can undo to initialState
    // const { past } = result.current; // Access internal state for assertion (not ideal but common for hooks)
    // This requires making 'past' accessible or testing through behavior.
    // Let's test through behavior of undo:
    act(() => {
      result.current.undo();
    });
    expect(result.current.currentState).toEqual(initialState); // Undoes to state before stateA, skipping stateB
  });


  test('undo should revert to the previous state', () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    act(() => {
      result.current.setCurrentState(stateA);
    });
    act(() => {
      result.current.setCurrentState(stateB);
    });

    expect(result.current.currentState).toEqual(stateB);
    act(() => {
      result.current.undo();
    });
    expect(result.current.currentState).toEqual(stateA);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.undo();
    });
    expect(result.current.currentState).toEqual(initialState);
    expect(result.current.canUndo).toBe(false); // Reached initial state
    expect(result.current.canRedo).toBe(true);
  });

  test('redo should apply the next state from the future', () => {
    const { result } = renderHook(() => useEditorHistory(initialState));
    act(() => result.current.setCurrentState(stateA));
    act(() => result.current.setCurrentState(stateB)); // present: stateB, past: [initialState, stateA]
    act(() => result.current.undo()); // present: stateA, past: [initialState], future: [stateB]
    act(() => result.current.undo()); // present: initialState, past: [], future: [stateA, stateB]

    expect(result.current.currentState).toEqual(initialState);
    act(() => {
      result.current.redo();
    });
    expect(result.current.currentState).toEqual(stateA);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.currentState).toEqual(stateB);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false); // Reached end of future
  });

  test('undo and redo should not change state if history is empty', () => {
    const { result } = renderHook(() => useEditorHistory(initialState));

    act(() => result.current.undo()); // No past states
    expect(result.current.currentState).toEqual(initialState);
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.redo()); // No future states
    expect(result.current.currentState).toEqual(initialState);
    expect(result.current.canRedo).toBe(false);
  });
  
  test('should not exceed MAX_HISTORY_LENGTH for past states', () => {
    // Assuming MAX_HISTORY_LENGTH is 50 as defined in the hook
    const MAX_HISTORY_LENGTH = 50;
    const { result } = renderHook(() => useEditorHistory(initialState));

    for (let i = 0; i < MAX_HISTORY_LENGTH + 5; i++) {
      act(() => result.current.setCurrentState([{ id: `comp${i}`, type: 'Text', name: `State ${i}`, properties: {} }]));
    }
    
    // To check the actual length of 'past', we would need to expose it from the hook,
    // or infer it by undoing MAX_HISTORY_LENGTH times and checking the state.
    // Let's infer by behavior:
    for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
      act(() => result.current.undo());
    }
    // After MAX_HISTORY_LENGTH undos, we should be at the initialState (or the earliest recorded state)
    // The hook stores `present` in `past` before updating `present`.
    // So, the `past` array will contain `initialState` as its first element after the first `setCurrentState`.
    // After 50 `setCurrentState` calls beyond the initial one, `past` will have 50 entries.
    // Undoing 50 times should bring us back to `initialState`.
    expect(result.current.currentState).toEqual(initialState); 
    expect(result.current.canUndo).toBe(false); // Should be at the beginning of history
  });
});
