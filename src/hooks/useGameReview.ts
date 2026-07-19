import { useState, useRef, useCallback } from 'react';
import { Move, Chess } from 'chess.js';
import { analyzeMove } from '../utils/chessUtils';
import { stockfishPool, type EngineResult } from '../utils/StockfishPool';

export type MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';

export interface AnalysisResult extends EngineResult {
  classification?: MoveClassification; // the classification of the move that led to this position
  delta?: number; // centipawn loss
}

export function useGameReview() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  
  const cancelRef = useRef<boolean>(false);

  const startAnalysis = useCallback(async (history: Move[]) => {
    if (history.length === 0) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    cancelRef.current = false;
    
    const fensToEvaluate = [history[0].before, ...history.map(m => m.after)];
    
    const evaluatePromises = fensToEvaluate.map(async (fen) => {
      // Short circuit for game over states to prevent the engine from hanging
      try {
        const chess = new Chess(fen);
        if (chess.isGameOver()) {
          let finalScore = 0;
          let isMate = false;
          if (chess.isCheckmate()) {
            isMate = true;
            finalScore = chess.turn() === 'w' ? -100 : 100;
          }
          return { score: finalScore, isMate, bestMove: '(none)' };
        }
      } catch {
         // ignore parsing errors and fallback to engine
      }
      
      return stockfishPool.evaluate(fen, 10);
    });

    try {
      let completed = 0;
      const progressPromises = evaluatePromises.map(p => p.then(res => {
        completed++;
        setProgress(Math.round((completed / fensToEvaluate.length) * 100));
        return res;
      }));
      
      const rawResults = await Promise.all(progressPromises);
      
      if (cancelRef.current) return;

      const results: AnalysisResult[] = [];
      for (let i = 0; i < rawResults.length; i++) {
        const res = rawResults[i];
        let classification: MoveClassification | undefined;
        let delta: number | undefined;

        if (i > 0) {
          const prevRes = rawResults[i - 1];
          const color = history[i - 1].color;
          const analysis = analyzeMove(prevRes, res, color);
          classification = analysis.classification as MoveClassification;
          delta = analysis.delta;
        }

        results.push({
          score: res.score,
          isMate: res.isMate,
          bestMove: res.bestMove,
          classification,
          delta
        });
      }
      
      setAnalysisResults(results);
    } catch (err) {
      console.error("Analysis interrupted or failed", err);
    } finally {
      if (!cancelRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    cancelRef.current = true;
    stockfishPool.terminateAll();
    setIsAnalyzing(false);
  }, []);

  return { isAnalyzing, progress, analysisResults, startAnalysis, cancelAnalysis };
}
