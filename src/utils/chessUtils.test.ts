import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { getCapturedAndMaterial, classifyMove, getGameOverResult, analyzeMove } from './chessUtils';

describe('chessUtils', () => {
  describe('getCapturedAndMaterial', () => {
    it('should return initial empty captured pieces and zero advantage', () => {
      const chess = new Chess();
      const wStats = getCapturedAndMaterial(chess, 'w');
      const bStats = getCapturedAndMaterial(chess, 'b');

      expect(wStats.captured).toEqual([]);
      expect(wStats.advantage).toBe(0);
      expect(bStats.captured).toEqual([]);
      expect(bStats.advantage).toBe(0);
    });

    it('should calculate captured pieces and material advantage correctly after moves', () => {
      const chess = new Chess();
      // 1. e4 d5 2. exd5 Qxd5 (White pawns: 7, Black pawns: 7, Black Queen captured White pawn at d5, White pawn captured Black pawn at d5)
      chess.move('e4');
      chess.move('d5');
      chess.move('exd5'); // White pawn captures Black pawn

      // At this point, Black is missing one pawn. White has all 8 pawns.
      // So White has a captured pawn ('p') in their captured list (opponent's piece captured).
      // Wait, getCapturedAndMaterial returns captured pieces belonging to the opponent or player?
      // Let's check original implementation logic:
      // const capturedCount = Math.max(0, INITIAL_COUNTS[type] - currentCounts[opponentColor][type]);
      // Return captured pieces from opponent's perspective.
      // So getCapturedAndMaterial(chess, 'w') returns pieces White has captured (i.e. opponent's missing pieces).
      const wStatsAfterCapture = getCapturedAndMaterial(chess, 'w');
      expect(wStatsAfterCapture.captured).toEqual(['p']);
      expect(wStatsAfterCapture.advantage).toBe(1); // White is up 1 pawn (+1)

      const bStatsAfterCapture = getCapturedAndMaterial(chess, 'b');
      expect(bStatsAfterCapture.captured).toEqual([]);
      expect(bStatsAfterCapture.advantage).toBe(-1); // Black is down 1 pawn (-1)
    });
  });

  describe('classifyMove', () => {
    it('should classify as best if mate or prevIsMate is true', () => {
      expect(classifyMove(0, true, false)).toBe('best');
      expect(classifyMove(-4, false, true)).toBe('best');
      expect(classifyMove(0, true, true)).toBe('best');
    });

    it('should classify based on centipawn loss delta thresholds', () => {
      expect(classifyMove(-0.1, false, false)).toBe('best');
      expect(classifyMove(-0.19, false, false)).toBe('best');
      
      expect(classifyMove(-0.2, false, false)).toBe('excellent');
      expect(classifyMove(-0.49, false, false)).toBe('excellent');
      
      expect(classifyMove(-0.5, false, false)).toBe('good');
      expect(classifyMove(-0.99, false, false)).toBe('good');
      
      expect(classifyMove(-1.0, false, false)).toBe('inaccuracy');
      expect(classifyMove(-1.99, false, false)).toBe('inaccuracy');
      
      expect(classifyMove(-2.0, false, false)).toBe('mistake');
      expect(classifyMove(-2.99, false, false)).toBe('mistake');
      
      expect(classifyMove(-3.0, false, false)).toBe('blunder');
      expect(classifyMove(-10.0, false, false)).toBe('blunder');
    });
  });

  describe('analyzeMove', () => {
    it('should correctly analyze a White move', () => {
      const beforeEval = { score: 1.5, isMate: false };
      const afterEval = { score: 1.2, isMate: false };
      const result = analyzeMove(beforeEval, afterEval, 'w');
      expect(result.delta).toBeCloseTo(-0.3);
      expect(result.classification).toBe('excellent');
    });

    it('should correctly analyze a Black move', () => {
      const beforeEval = { score: -1.0, isMate: false };
      const afterEval = { score: -0.5, isMate: false };
      const result = analyzeMove(beforeEval, afterEval, 'b');
      expect(result.delta).toBeCloseTo(-0.5);
      expect(result.classification).toBe('good');
    });

    it('should handle mate evaluations', () => {
      const beforeEval = { score: 5.0, isMate: false };
      const afterEval = { score: 10.0, isMate: true };
      const result = analyzeMove(beforeEval, afterEval, 'w');
      expect(result.classification).toBe('best');
    });
  });

  describe('getGameOverResult', () => {
    it('should return checkmate message if isCheckmate is true', () => {
      expect(getGameOverResult(true, false, 'w')).toBe('Checkmate! Black wins.');
      expect(getGameOverResult(true, false, 'b')).toBe('Checkmate! White wins.');
    });

    it('should return stalemate message if isStalemate is true', () => {
      expect(getGameOverResult(false, true, 'w')).toBe('Game Over — Stalemate');
      expect(getGameOverResult(false, true, 'b')).toBe('Game Over — Stalemate');
    });

    it('should return null if neither checkmate nor stalemate is true', () => {
      expect(getGameOverResult(false, false, 'w')).toBeNull();
    });
  });
});
