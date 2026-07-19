import { useMemo } from 'react';
import { Move } from 'chess.js';
import type { AnalysisResult, MoveClassification } from './useGameReview';
import { analyzeMove } from '../utils/chessUtils';

export interface Arrow {
  startSquare: string;
  endSquare: string;
  color: string;
}

interface UseLiveAnalysisParams {
  coachMode: boolean;
  evalCache: Record<string, { score: number; isMate: boolean; bestMove?: string }>;
  history: Move[];
  fen: string;
  reviewMode: boolean;
  reviewIndex: number;
  analysisResults: AnalysisResult[];
  hintArrow: Arrow | null;
}

export function useLiveAnalysis({
  coachMode,
  evalCache,
  history,
  fen,
  reviewMode,
  reviewIndex,
  analysisResults,
  hintArrow,
}: UseLiveAnalysisParams) {
  // Live analysis for coach mode
  const liveAnalysis = useMemo(() => {
    if (!coachMode) return undefined;

    const results: AnalysisResult[] = [
      {
        score: evalCache[history[0]?.before || fen]?.score || 0,
        isMate: evalCache[history[0]?.before || fen]?.isMate || false,
        bestMove: evalCache[history[0]?.before || fen]?.bestMove || '(none)',
      },
    ];

    for (let i = 0; i < history.length; i++) {
      const beforeEval = evalCache[history[i].before];
      const afterEval = evalCache[history[i].after];

      if (beforeEval && afterEval) {
        const color = history[i].color;
        const analysis = analyzeMove(beforeEval, afterEval, color);

        results.push({
          score: afterEval.score,
          isMate: afterEval.isMate,
          bestMove: beforeEval.bestMove || '(none)',
          classification: analysis.classification as MoveClassification,
          delta: analysis.delta,
        });
      } else {
        results.push({ score: 0, isMate: false, bestMove: '(none)' });
      }
    }
    return results;
  }, [coachMode, evalCache, history, fen]);

  // Move classification badge on the board
  const moveClassification = useMemo(() => {
    if (reviewMode && reviewIndex > 0) {
      const classification = analysisResults[reviewIndex]?.classification;
      if (classification && classification !== 'book') {
        return { square: history[reviewIndex - 1].to, classification };
      }
    } else if (!reviewMode && coachMode && history.length > 0 && liveAnalysis && liveAnalysis[history.length]) {
      const classification = liveAnalysis[history.length].classification;
      if (classification && classification !== 'book') {
        return { square: history[history.length - 1].to, classification };
      }
    }
    return null;
  }, [reviewMode, reviewIndex, analysisResults, history, coachMode, liveAnalysis]);

  // Current arrows to show on board
  const currentArrows = useMemo(() => {
    const arrows = hintArrow ? [hintArrow] : [];
    if (reviewMode && analysisResults[reviewIndex]?.bestMove) {
      const best = analysisResults[reviewIndex].bestMove!;
      return [{ startSquare: best.substring(0, 2), endSquare: best.substring(2, 4), color: 'rgba(50, 205, 50, 0.5)' }];
    }
    return arrows;
  }, [hintArrow, reviewMode, reviewIndex, analysisResults]);

  return {
    liveAnalysis,
    moveClassification,
    currentArrows,
  };
}
