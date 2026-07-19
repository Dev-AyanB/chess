import { Chess } from 'chess.js';

export const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const INITIAL_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1 };

/**
 * Calculates captured pieces and material advantage for a given player.
 * Takes the Chess game instance directly to decouple from useChessGame hook.
 */
export function getCapturedAndMaterial(gameInstance: Chess, playerColor: 'w' | 'b') {
  const currentCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };
  const board = gameInstance.board();

  board.forEach((row) => {
    row.forEach((piece) => {
      if (piece && piece.type !== 'k') {
        const type = piece.type as keyof typeof INITIAL_COUNTS;
        if (currentCounts[piece.color] && currentCounts[piece.color][type] !== undefined) {
          currentCounts[piece.color][type]++;
        }
      }
    });
  });

  const opponentColor: 'w' | 'b' = playerColor === 'w' ? 'b' : 'w';

  const captured = Object.keys(INITIAL_COUNTS).flatMap((pieceType) => {
    const type = pieceType as keyof typeof INITIAL_COUNTS;
    const capturedCount = Math.max(0, INITIAL_COUNTS[type] - currentCounts[opponentColor][type]);
    return Array(capturedCount).fill(type) as string[];
  });

  let myMaterial = 0;
  let opponentMaterial = 0;
  Object.keys(INITIAL_COUNTS).forEach((pt) => {
    const type = pt as keyof typeof INITIAL_COUNTS;
    myMaterial += currentCounts[playerColor][type] * PIECE_VALUES[type];
    opponentMaterial += currentCounts[opponentColor][type] * PIECE_VALUES[type];
  });

  return { captured, advantage: myMaterial - opponentMaterial };
}

export interface ClassificationDetail {
  symbol: string;
  colorClass: string;
  label: string;
}

export const CLASSIFICATION_DETAILS: Record<string, ClassificationDetail> = {
  best: { symbol: '★', colorClass: 'bg-best', label: 'Best Move' },
  excellent: { symbol: '!', colorClass: 'bg-excellent', label: 'Excellent' },
  good: { symbol: '✓', colorClass: 'bg-good', label: 'Good' },
  inaccuracy: { symbol: '?!', colorClass: 'bg-inaccuracy', label: 'Inaccuracy' },
  mistake: { symbol: '?', colorClass: 'bg-mistake', label: 'Mistake' },
  blunder: { symbol: '??', colorClass: 'bg-blunder', label: 'Blunder' },
};

/**
 * Classifies a move based on centipawn loss (delta) and mate evaluations.
 */
export function classifyMove(delta: number, isMate: boolean, prevIsMate: boolean): string {
  if (isMate || prevIsMate) {
    return 'best';
  }
  if (delta > -0.2) return 'best';
  if (delta > -0.5) return 'excellent';
  if (delta > -1.0) return 'good';
  if (delta > -2.0) return 'inaccuracy';
  if (delta > -3.0) return 'mistake';
  return 'blunder';
}

/**
 * Analyzes a move by comparing the evaluation before and after the move.
 */
export function analyzeMove(
  beforeEval: { score: number; isMate: boolean; bestMove?: string },
  afterEval: { score: number; isMate: boolean },
  color: 'w' | 'b'
): { classification: string; delta: number } {
  const isWhiteMove = color === 'w';
  const delta = isWhiteMove
    ? afterEval.score - beforeEval.score
    : beforeEval.score - afterEval.score;

  const classification = classifyMove(delta, afterEval.isMate, beforeEval.isMate);
  return { classification, delta };
}

/**
 * Formats game over status text based on checkmate or stalemate conditions.
 */
export function getGameOverResult(isCheckmate: boolean, isStalemate: boolean, turn: 'w' | 'b'): string | null {
  if (isCheckmate) {
    return `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins.`;
  }
  if (isStalemate) {
    return 'Game Over — Stalemate';
  }
  return null;
}
