import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from './useChessGame';

describe('useChessGame', () => {
  it('should initialize with starting position', () => {
    const { result } = renderHook(() => useChessGame());
    expect(result.current.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.current.turn).toBe('w');
    expect(result.current.isGameOver).toBe(false);
  });

  it('should allow valid moves', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => {
      result.current.makeMove({ from: 'e2', to: 'e4' });
    });
    expect(result.current.turn).toBe('b');
    expect(result.current.history.length).toBe(1);
  });

  it('should reject invalid moves', () => {
    const { result } = renderHook(() => useChessGame());
    let isValid = true;
    act(() => {
      isValid = result.current.makeMove({ from: 'e2', to: 'e5' });
    });
    expect(isValid).toBe(false);
    expect(result.current.turn).toBe('w');
  });

  it('should allow undoing a move', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => {
      result.current.makeMove({ from: 'e2', to: 'e4' });
    });
    expect(result.current.turn).toBe('b');
    act(() => {
      result.current.undo();
    });
    expect(result.current.turn).toBe('w');
    expect(result.current.history.length).toBe(0);
  });

  it('should detect checkmate (Fool\'s mate)', () => {
    const { result } = renderHook(() => useChessGame());
    act(() => { result.current.makeMove({ from: 'f2', to: 'f3' }); });
    act(() => { result.current.makeMove({ from: 'e7', to: 'e5' }); });
    act(() => { result.current.makeMove({ from: 'g2', to: 'g4' }); });
    act(() => { result.current.makeMove({ from: 'd8', to: 'h4' }); }); // Checkmate
    
    expect(result.current.isCheckmate).toBe(true);
    expect(result.current.isGameOver).toBe(true);
  });

  it('should handle castling', () => {
    const { result } = renderHook(() => useChessGame());
    // Setup for short castle
    act(() => { result.current.makeMove('e4'); });
    act(() => { result.current.makeMove('e5'); });
    act(() => { result.current.makeMove('Nf3'); });
    act(() => { result.current.makeMove('Nc6'); });
    act(() => { result.current.makeMove('Bc4'); });
    act(() => { result.current.makeMove('Bc5'); });
    
    // Castle
    act(() => { result.current.makeMove('O-O'); });
    expect(result.current.history[result.current.history.length - 1].san).toBe('O-O');
  });

  it('should handle FEN loading', () => {
    const { result } = renderHook(() => useChessGame());
    const targetFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    act(() => {
      result.current.loadFen(targetFen);
    });
    expect(result.current.fen).toBe(targetFen);
  });
  it('should handle redo logic', () => {
    const { result } = renderHook(() => useChessGame());
    
    // Make 2 moves
    act(() => { result.current.makeMove('e4'); });
    act(() => { result.current.makeMove('e5'); });
    expect(result.current.history.length).toBe(2);
    expect(result.current.redoStack.length).toBe(0);

    // Undo 1 move
    act(() => { result.current.undo(); });
    expect(result.current.history.length).toBe(1);
    expect(result.current.redoStack.length).toBe(1);

    // Redo 1 move
    act(() => { result.current.redo(); });
    expect(result.current.history.length).toBe(2);
    expect(result.current.redoStack.length).toBe(0);
    expect(result.current.history[1].san).toBe('e5');

    // Undo again, then make a new move -> should clear redoStack
    act(() => { result.current.undo(); });
    expect(result.current.redoStack.length).toBe(1);
    act(() => { result.current.makeMove('d5'); });
    expect(result.current.redoStack.length).toBe(0);
  });
});
