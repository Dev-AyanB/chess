import { useState, useEffect } from 'react';
import { useStockfish } from './useStockfish';

export interface UseEngineOpponentProps {
  fen: string;
  turn: 'w' | 'b';
  isGameOver: boolean;
  gameMode: string;
  playerColor: string;
  depth: number;
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  reviewMode: boolean;
}

export function useEngineOpponent(
  propsOrFen: UseEngineOpponentProps | string,
  turnParam?: 'w' | 'b',
  isGameOverParam?: boolean,
  gameModeParam?: string,
  playerColorParam?: string,
  depthParam?: number,
  makeMoveParam?: (move: { from: string; to: string; promotion?: string }) => boolean,
  reviewModeParam?: boolean
) {
  const isObject = typeof propsOrFen === 'object' && propsOrFen !== null;

  const fen = isObject ? (propsOrFen as UseEngineOpponentProps).fen : (propsOrFen as string);
  const turn = isObject ? (propsOrFen as UseEngineOpponentProps).turn : turnParam!;
  const isGameOver = isObject ? (propsOrFen as UseEngineOpponentProps).isGameOver : isGameOverParam!;
  const gameMode = isObject ? (propsOrFen as UseEngineOpponentProps).gameMode : gameModeParam!;
  const playerColor = isObject ? (propsOrFen as UseEngineOpponentProps).playerColor : playerColorParam!;
  const depth = isObject ? (propsOrFen as UseEngineOpponentProps).depth : depthParam!;
  const makeMove = isObject ? (propsOrFen as UseEngineOpponentProps).makeMove : makeMoveParam!;
  const reviewMode = isObject ? (propsOrFen as UseEngineOpponentProps).reviewMode : reviewModeParam!;

  const { isEngineReady, isThinking, evaluatePosition } = useStockfish();

  const [evalState, setEvalState] = useState<{ score: number; isMate: boolean }>({ score: 0, isMate: false });
  const [evalCache, setEvalCache] = useState<Record<string, { score: number; isMate: boolean; bestMove?: string }>>({});

  useEffect(() => {
    if (isGameOver || !isEngineReady || reviewMode) return;

    if (gameMode === 'computer' && turn !== playerColor) {
      evaluatePosition(
        fen,
        depth,
        (bestMove) => {
          setEvalCache((prev) => ({ ...prev, [fen]: { ...(prev[fen] || { score: 0, isMate: false }), bestMove } }));
          const from = bestMove.substring(0, 2);
          const to = bestMove.substring(2, 4);
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
          makeMove({ from, to, promotion });
        },
        (score, isMate) => {
          setEvalState({ score, isMate });
          setEvalCache((prev) => ({ ...prev, [fen]: { ...(prev[fen] || { bestMove: undefined }), score, isMate } }));
        },
      );
    } else {
      evaluatePosition(
        fen,
        10,
        (bestMove) => {
          setEvalCache((prev) => ({ ...prev, [fen]: { ...(prev[fen] || { score: 0, isMate: false }), bestMove } }));
        },
        (score, isMate) => {
          setEvalState({ score, isMate });
          setEvalCache((prev) => ({ ...prev, [fen]: { ...(prev[fen] || { bestMove: undefined }), score, isMate } }));
        },
      );
    }
  }, [fen, turn, isGameOver, gameMode, playerColor, isEngineReady, depth, evaluatePosition, makeMove, reviewMode, setEvalCache, setEvalState]);

  return {
    evalState,
    setEvalState,
    evalCache,
    setEvalCache,
    isThinking,
    isEngineReady,
    evaluatePosition,
  };
}
