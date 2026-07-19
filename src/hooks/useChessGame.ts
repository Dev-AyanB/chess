/* eslint-disable react-hooks/refs */
import { useState, useCallback, useRef, useMemo } from 'react';
import { Chess, Move } from 'chess.js';

export function useChessGame() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [history, setHistory] = useState<Move[]>([]);
  const [redoStack, setRedoStack] = useState<Move[]>([]);
  // Tick to force React to re-evaluate derived state like isGameOver
  const [tick, setTick] = useState(0);

  const updateState = useCallback(() => {
    setFen(gameRef.current.fen());
    setHistory(gameRef.current.history({ verbose: true }) as Move[]);
    setTick(t => t + 1);
  }, []);

  const makeMove = useCallback(
    (move: string | { from: string; to: string; promotion?: string }) => {
      try {
        const result = gameRef.current.move(move);

        if (result) {
          setRedoStack([]);
          updateState();
          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
    [updateState]
  );

  const undo = useCallback((levels: number = 1) => {
    const poppedMoves: Move[] = [];
    for (let i = 0; i < levels; i++) {
      const move = gameRef.current.undo();
      if (move) {
        poppedMoves.push(move as Move);
      }
    }
    if (poppedMoves.length > 0) {
      setRedoStack((prev) => [...prev, ...poppedMoves.reverse()]);
      updateState();
    }
  }, [updateState]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const moveToRedo = redoStack[redoStack.length - 1];
    try {
      const result = gameRef.current.move(moveToRedo.san);
      if (result) {
        setRedoStack((prev) => prev.slice(0, -1));
        updateState();
      }
    } catch {
      // Ignore
    }
  }, [redoStack, updateState]);

  const reset = useCallback(() => {
    gameRef.current.reset();
    setRedoStack([]);
    updateState();
  }, [updateState]);

  const loadFen = useCallback((newFen: string) => {
    try {
      gameRef.current.load(newFen);
      setRedoStack([]);
      updateState();
      return true;
    } catch {
      return false;
    }
  }, [updateState]);

  // Derived state that depends on the game instance. Re-evaluates when tick changes.
  const derivedState = useMemo(() => {
    void tick;
    return {
      isGameOver: gameRef.current.isGameOver(),
      isCheckmate: gameRef.current.isCheckmate(),
      isDraw: gameRef.current.isDraw(),
      isStalemate: gameRef.current.isStalemate(),
      turn: gameRef.current.turn(),
    };
  }, [tick]);

  return {
    game: gameRef.current,
    fen,
    history,
    makeMove,
    undo,
    redo,
    redoStack,
    reset,
    loadFen,
    ...derivedState,
  };
}
