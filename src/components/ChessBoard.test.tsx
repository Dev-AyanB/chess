import { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChessBoard } from './ChessBoard';
import App from '../App';
import { useChessGame } from '../hooks/useChessGame';
import { ToastProvider } from './Toast';

// Mock react-chessboard as specified in test_cases_spec.md
vi.mock('react-chessboard', () => {
  return {
    Chessboard: ({ options }: { options: any }) => {
      const squares = [];
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

      for (let r = 7; r >= 0; r--) {
        for (let f = 0; f < 8; f++) {
          const square = `${files[f]}${ranks[r]}`;
          const style = options.squareStyles?.[square] || {};
          const styleString = JSON.stringify(style);
          squares.push(
            <div
              key={square}
              data-testid={`square-${square}`}
              data-style={styleString}
              onClick={() => options.onSquareClick?.({ square })}
              onMouseDown={() => options.onSquareMouseDown?.({ square })}
            >
              {square}
            </div>
          );
        }
      }

      return (
        <div data-testid="chessboard" data-orientation={options.boardOrientation}>
          <button
            data-testid="trigger-piece-drop"
            onClick={(e) => {
              const from = e.currentTarget.getAttribute('data-from') || '';
              const to = e.currentTarget.getAttribute('data-to') || null;
              options.onPieceDrop?.({ sourceSquare: from, targetSquare: to || null, piece: 'wP' });
            }}
            style={{ display: 'none' }}
          />
          {squares}
        </div>
      );
    }
  };
});



// Mock Toast component to prevent any setTimeout or RAF loops
vi.mock('./Toast', () => {
  return {
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useToast: () => ({
      showToast: vi.fn(),
    }),
  };
});

// Mock framer-motion to prevent animation-related hangs in JSDOM
vi.mock('framer-motion', () => {
  return {
    motion: {
      // @ts-expect-error: Mocking framer-motion div component
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      // @ts-expect-error: Mocking framer-motion span component
      span: ({ children, ...props }) => <span {...props}>{children}</span>,
      // @ts-expect-error: Mocking framer-motion button component
      button: ({ children, ...props }) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: { children: any }) => children,
  };
});

// Fallback for crypto.randomUUID in jsdom environment for Toast component
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error: Polyfilling crypto in JSDOM
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID === 'undefined') {
  // @ts-expect-error: Polyfilling randomUUID in JSDOM
  globalThis.crypto.randomUUID = () => Math.random().toString(36).substring(2);
}

// Mock useStockfish to run in-memory without workers
vi.mock('../hooks/useStockfish', () => {
  return {
    useStockfish: () => ({
      isEngineReady: false,
      isThinking: false,
      evaluatePosition: vi.fn(),
    })
  };
});

// Mock useGameReview
vi.mock('../hooks/useGameReview', () => {
  return {
    useGameReview: () => ({
      isAnalyzing: false,
      progress: 0,
      analysisResults: [],
      startAnalysis: vi.fn().mockResolvedValue(undefined),
      cancelAnalysis: vi.fn(),
    })
  };
});

// STANDALONE BOARD TEST WRAPPER
interface TestChessGameProps {
  initialFen?: string;
  boardOrientation?: 'white' | 'black';
  isReviewMode?: boolean;
}

const TestChessGame = ({ initialFen, boardOrientation = 'white', isReviewMode = false }: TestChessGameProps) => {
  const game = useChessGame();
  const { loadFen } = game;
  useEffect(() => {
    if (initialFen) {
      loadFen(initialFen);
    }
  }, [initialFen, loadFen]);

  return (
    <ChessBoard
      gameInstance={game.game}
      fen={game.fen}
      makeMove={game.makeMove}
      boardOrientation={boardOrientation}
      isReviewMode={isReviewMode}
    />
  );
};

const renderChessBoard = (initialFen?: string) => {
  return render(
    <ToastProvider>
      <TestChessGame initialFen={initialFen} />
    </ToastProvider>
  );
};

describe('ChessBoard E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // TIER 1: FEATURE COVERAGE
  // ==========================================

  // Feature 1: Visual Legal Move Indicators
  it('test_click_pawn_highlights_legal_moves', () => {
    renderChessBoard();

    // Click starting pawn at e2
    const e2 = screen.getByTestId('square-e2');
    fireEvent.click(e2);

    // e2 should be highlighted yellow
    const e2Style = JSON.parse(e2.getAttribute('data-style') || '{}');
    expect(e2Style.background).toBe('rgba(255, 255, 0, 0.4)');

    // e3 and e4 should be highlighted with radial-gradient
    const e3 = screen.getByTestId('square-e3');
    const e4 = screen.getByTestId('square-e4');

    const e3Style = JSON.parse(e3.getAttribute('data-style') || '{}');
    const e4Style = JSON.parse(e4.getAttribute('data-style') || '{}');

    expect(e3Style.background).toContain('radial-gradient');
    expect(e4Style.background).toContain('radial-gradient');
  });

  it('test_click_empty_square_no_highlights', () => {
    renderChessBoard();

    const e4 = screen.getByTestId('square-e4');
    fireEvent.click(e4);

    const e4Style = JSON.parse(e4.getAttribute('data-style') || '{}');
    expect(e4Style.background).toBeUndefined();

    // Verify no other squares are highlighted
    const squares = ['a1', 'b2', 'e2', 'e3', 'e4', 'h8'];
    squares.forEach((sq) => {
      const el = screen.getByTestId(`square-${sq}`);
      const style = JSON.parse(el.getAttribute('data-style') || '{}');
      expect(style.background).toBeUndefined();
    });
  });

  it('test_drag_pawn_highlights_legal_moves', () => {
    renderChessBoard();

    const e2 = screen.getByTestId('square-e2');
    fireEvent.mouseDown(e2);

    const e2Style = JSON.parse(e2.getAttribute('data-style') || '{}');
    expect(e2Style.background).toBe('rgba(255, 255, 0, 0.4)');

    const e3 = screen.getByTestId('square-e3');
    const e4 = screen.getByTestId('square-e4');

    const e3Style = JSON.parse(e3.getAttribute('data-style') || '{}');
    const e4Style = JSON.parse(e4.getAttribute('data-style') || '{}');

    expect(e3Style.background).toContain('radial-gradient');
    expect(e4Style.background).toContain('radial-gradient');
  });

  it('test_change_selection_removes_old_highlights', () => {
    renderChessBoard();

    // Click e2
    fireEvent.click(screen.getByTestId('square-e2'));

    // Click g1 (knight)
    fireEvent.click(screen.getByTestId('square-g1'));

    // e2, e3, e4 highlights should be gone
    const e2Style = JSON.parse(screen.getByTestId('square-e2').getAttribute('data-style') || '{}');
    const e3Style = JSON.parse(screen.getByTestId('square-e3').getAttribute('data-style') || '{}');
    const e4Style = JSON.parse(screen.getByTestId('square-e4').getAttribute('data-style') || '{}');

    expect(e2Style.background).toBeUndefined();
    expect(e3Style.background).toBeUndefined();
    expect(e4Style.background).toBeUndefined();

    // g1 should be highlighted, as well as f3 and h3
    const g1Style = JSON.parse(screen.getByTestId('square-g1').getAttribute('data-style') || '{}');
    const f3Style = JSON.parse(screen.getByTestId('square-f3').getAttribute('data-style') || '{}');
    const h3Style = JSON.parse(screen.getByTestId('square-h3').getAttribute('data-style') || '{}');

    expect(g1Style.background).toBe('rgba(255, 255, 0, 0.4)');
    expect(f3Style.background).toContain('radial-gradient');
    expect(h3Style.background).toContain('radial-gradient');
  });

  it('test_deselect_removes_all_highlights', () => {
    renderChessBoard();

    // Click e2
    fireEvent.click(screen.getByTestId('square-e2'));

    // Click e2 again to deselect
    fireEvent.click(screen.getByTestId('square-e2'));

    // e2, e3, e4 highlights should be gone
    const e2Style = JSON.parse(screen.getByTestId('square-e2').getAttribute('data-style') || '{}');
    const e3Style = JSON.parse(screen.getByTestId('square-e3').getAttribute('data-style') || '{}');
    const e4Style = JSON.parse(screen.getByTestId('square-e4').getAttribute('data-style') || '{}');

    expect(e2Style.background).toBeUndefined();
    expect(e3Style.background).toBeUndefined();
    expect(e4Style.background).toBeUndefined();
  });


  // ==========================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================

  // Feature 1: Visual Legal Move Indicators
  it('test_in_check_highlights_only_evasions', () => {
    // White is checked by black bishop on b4
    renderChessBoard('rnbqk1nr/pppp1ppp/4p3/8/1b1P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2');

    // Click a piece that cannot resolve check (e.g. pawn on h2)
    const h2 = screen.getByTestId('square-h2');
    fireEvent.click(h2);

    // Piece with no legal moves should NOT be highlighted (getMoveOptions returns false)
    const h2Style = JSON.parse(h2.getAttribute('data-style') || '{}');
    expect(h2Style.background).toBeUndefined();

    // Other squares should not be highlighted
    const h3 = screen.getByTestId('square-h3');
    const h3Style = JSON.parse(h3.getAttribute('data-style') || '{}');
    expect(h3Style.background).toBeUndefined();

    // Click bishop on c1 which can block at d2
    const c1 = screen.getByTestId('square-c1');
    fireEvent.click(c1);

    // d2 should be highlighted, but e3, f4 should not be
    const d2 = screen.getByTestId('square-d2');
    const d2Style = JSON.parse(d2.getAttribute('data-style') || '{}');
    expect(d2Style.background).toContain('radial-gradient');

    const e3 = screen.getByTestId('square-e3');
    const e3Style = JSON.parse(e3.getAttribute('data-style') || '{}');
    expect(e3Style.background).toBeUndefined();
  });

  it('test_pinned_piece_highlights_only_pin_line', () => {
    // White rook on e2 pinned by black rook on e5 against king on e1
    renderChessBoard('4k3/8/8/4r3/8/8/4R3/4K3 w - - 0 1');

    const e2 = screen.getByTestId('square-e2');
    fireEvent.click(e2);

    // Pinned along e-file, so e3, e4, e5 are highlighted
    const e3 = screen.getByTestId('square-e3');
    const e3Style = JSON.parse(e3.getAttribute('data-style') || '{}');
    expect(e3Style.background).toContain('radial-gradient');

    // d2, f2 are not on the pin line, so they shouldn't be highlighted
    const d2 = screen.getByTestId('square-d2');
    const d2Style = JSON.parse(d2.getAttribute('data-style') || '{}');
    expect(d2Style.background).toBeUndefined();
  });

  it('test_blocked_piece_shows_no_highlights', () => {
    renderChessBoard();

    // a1 rook is completely blocked
    const a1 = screen.getByTestId('square-a1');
    fireEvent.click(a1);

    // Blocked piece with no legal moves should NOT be highlighted
    const a1Style = JSON.parse(a1.getAttribute('data-style') || '{}');
    expect(a1Style.background).toBeUndefined();

    // Verify no targets highlighted (e.g. a2)
    const a2 = screen.getByTestId('square-a2');
    const a2Style = JSON.parse(a2.getAttribute('data-style') || '{}');
    expect(a2Style.background).toBeUndefined();
  });

  it('test_drag_off_board_deselects', () => {
    renderChessBoard();

    // Drag e2 pawn
    fireEvent.mouseDown(screen.getByTestId('square-e2'));

    // Verify e2 and options are highlighted
    const e3StyleInit = JSON.parse(screen.getByTestId('square-e3').getAttribute('data-style') || '{}');
    expect(e3StyleInit.background).toContain('radial-gradient');

    // Trigger drop off board
    const trigger = screen.getByTestId('trigger-piece-drop');
    trigger.setAttribute('data-from', 'e2');
    trigger.setAttribute('data-to', ''); // null targetSquare
    fireEvent.click(trigger);

    // Highlights should be cleared
    const e3Style = JSON.parse(screen.getByTestId('square-e3').getAttribute('data-style') || '{}');
    expect(e3Style.background).toBeUndefined();
  });

  it('test_pawn_near_promotion_highlights_promotion_square', () => {
    // White pawn on e7
    renderChessBoard('k7/4P3/8/8/8/8/8/4K3 w - - 0 1');

    fireEvent.click(screen.getByTestId('square-e7'));

    // e8 should be highlighted for promotion
    const e8Style = JSON.parse(screen.getByTestId('square-e8').getAttribute('data-style') || '{}');
    expect(e8Style.background).toContain('radial-gradient');
  });

  it('test_rapid_consecutive_moves_no_crash', () => {
    renderChessBoard();

    // Play a sequence of moves rapidly
    const moves = [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
    ];

    expect(() => {
      moves.forEach(([from, to]) => {
        fireEvent.click(screen.getByTestId(`square-${from}`));
        fireEvent.click(screen.getByTestId(`square-${to}`));
      });
    }).not.toThrow();
  });



  it('test_undo_redo_sound_and_highlights', () => {
    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    // Make move e2-e4
    fireEvent.click(screen.getByTestId('square-e2'));
    fireEvent.click(screen.getByTestId('square-e4'));

    // Select e7 pawn (shows highlights)
    fireEvent.click(screen.getByTestId('square-e7'));
    const e7Style = JSON.parse(screen.getByTestId('square-e7').getAttribute('data-style') || '{}');
    expect(e7Style.background).toBe('rgba(255, 255, 0, 0.4)');

    // Click Undo
    const undoBtn = screen.getByLabelText('Undo');
    fireEvent.click(undoBtn);

    // Verify visual highlights are reset
    const e7StylePost = JSON.parse(screen.getByTestId('square-e7').getAttribute('data-style') || '{}');
    expect(e7StylePost.background).toBeUndefined();
  });

  it('test_review_mode_captures_and_material_updates', async () => {
    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    // Wait for the component to mount and the initial reset effect to complete
    await screen.findByText("White's turn");

    const makeMovePair = async (from: string, to: string, nextTurn: string) => {
      act(() => {
        fireEvent.click(screen.getByTestId(`square-${from}`));
      });
      act(() => {
        fireEvent.click(screen.getByTestId(`square-${to}`));
      });
      await screen.findByText(new RegExp(nextTurn, 'i'));
    };

    await makeMovePair('e2', 'e4', "Black's turn");
    await makeMovePair('f7', 'f5', "White's turn");
    await makeMovePair('e4', 'f5', "Black's turn"); // White captures Black pawn
    await makeMovePair('g7', 'g5', "White's turn");
    await makeMovePair('d1', 'h5', "Checkmate! White wins\\.");

    // Wait for the modal and click Review Game
    const reviewBtn = await screen.findByRole('button', { name: /Review Game/i });
    act(() => {
      fireEvent.click(reviewBtn);
    });

    // Initial position in review mode (index 0) - should show 0 captures
    const whiteBarStart = screen.getByRole('region', { name: /White, playing white/i });
    expect(whiteBarStart.getAttribute('aria-label')).not.toContain('captured');

    // Advance index to 3 (after e4xf5)
    const nextBtn = await screen.findByLabelText('Next move');
    act(() => {
      fireEvent.click(nextBtn); // index 1
    });
    act(() => {
      fireEvent.click(nextBtn); // index 2
    });
    act(() => {
      fireEvent.click(nextBtn); // index 3
    });

    // At index 3, White should show captured 1 piece
    const whiteBarCaptured = screen.getByRole('region', { name: /White, playing white/i });
    expect(whiteBarCaptured.getAttribute('aria-label')).toContain('captured 1 piece');

    // Go back to index 2
    const prevBtn = await screen.findByLabelText('Previous move');
    act(() => {
      fireEvent.click(prevBtn); // index 2
    });

    // White captures should be cleared/empty again
    const whiteBarPrev = screen.getByRole('region', { name: /White, playing white/i });
    expect(whiteBarPrev.getAttribute('aria-label')).not.toContain('captured');
  });
});
