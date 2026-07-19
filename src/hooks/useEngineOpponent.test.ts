import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEngineOpponent } from './useEngineOpponent';
import { useStockfish } from './useStockfish';

// Mock useStockfish
vi.mock('./useStockfish', () => {
  return {
    useStockfish: vi.fn(),
  };
});

describe('useEngineOpponent', () => {
  const mockEvaluatePosition = vi.fn();
  const mockMakeMove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStockfish).mockReturnValue({
      isEngineReady: true,
      isThinking: false,
      evaluatePosition: mockEvaluatePosition,
    });
    mockMakeMove.mockReturnValue(true);
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() =>
      useEngineOpponent({
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        isGameOver: false,
        gameMode: 'local',
        playerColor: 'w',
        depth: 10,
        makeMove: mockMakeMove,
        reviewMode: false,
      })
    );

    expect(result.current.evalState).toEqual({ score: 0, isMate: false });
    expect(result.current.evalCache).toEqual({});
    expect(result.current.isEngineReady).toBe(true);
    expect(result.current.isThinking).toBe(false);
  });

  it('should trigger evaluation on turn change if game mode is computer and turn is opponent', () => {
    renderHook(() =>
      useEngineOpponent({
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'b', // Opponent's turn (since player is white)
        isGameOver: false,
        gameMode: 'computer',
        playerColor: 'w',
        depth: 10,
        makeMove: mockMakeMove,
        reviewMode: false,
      })
    );

    expect(mockEvaluatePosition).toHaveBeenCalledTimes(1);
    // Should call evaluatePosition with depth
    expect(mockEvaluatePosition).toHaveBeenCalledWith(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      10,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should trigger evaluation with depth 10 if game mode is not computer', () => {
    renderHook(() =>
      useEngineOpponent({
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        isGameOver: false,
        gameMode: 'local',
        playerColor: 'w',
        depth: 12, // depth is 12, but for local mode it should default to 10
        makeMove: mockMakeMove,
        reviewMode: false,
      })
    );

    expect(mockEvaluatePosition).toHaveBeenCalledTimes(1);
    expect(mockEvaluatePosition).toHaveBeenCalledWith(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      10,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should update evalState and evalCache when evaluation callbacks are triggered', () => {
    let onBestMoveCallback: ((move: string) => void) | undefined;
    let onEvalCallback: ((score: number, isMate: boolean) => void) | undefined;

    mockEvaluatePosition.mockImplementation((_fen, _depth, onBestMove, onEval) => {
      onBestMoveCallback = onBestMove;
      onEvalCallback = onEval;
    });

    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const { result } = renderHook(() =>
      useEngineOpponent({
        fen,
        turn: 'w',
        isGameOver: false,
        gameMode: 'local',
        playerColor: 'w',
        depth: 10,
        makeMove: mockMakeMove,
        reviewMode: false,
      })
    );

    expect(onEvalCallback).toBeDefined();
    expect(onBestMoveCallback).toBeDefined();

    // Trigger eval callback
    act(() => {
      onEvalCallback!(0.5, false);
    });

    expect(result.current.evalState).toEqual({ score: 0.5, isMate: false });
    expect(result.current.evalCache[fen]).toEqual({
      score: 0.5,
      isMate: false,
      bestMove: undefined,
    });

    // Trigger best move callback
    act(() => {
      onBestMoveCallback!('e2e4');
    });

    expect(result.current.evalCache[fen]).toEqual({
      score: 0.5,
      isMate: false,
      bestMove: 'e2e4',
    });
  });
});
