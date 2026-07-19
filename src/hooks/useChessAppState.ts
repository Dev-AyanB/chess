import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useChessGame } from './useChessGame';
import { useSound } from './useSound';
import { useEngineOpponent } from './useEngineOpponent';
import { useGameReview } from './useGameReview';
import { useToast } from '../components/Toast';
import { useLiveAnalysis, type Arrow } from './useLiveAnalysis';
import { getCapturedAndMaterial, getGameOverResult as getGameOverStatusText } from '../utils/chessUtils';
import type { GameMode, PlayerColor } from '../components/GameSettings';

export function useChessAppState() {
  const game = useChessGame();
  const { isAnalyzing, progress, analysisResults, startAnalysis, cancelAnalysis } = useGameReview();
  const { showToast } = useToast();

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [depth, setDepth] = useState<number>(10);
  const [hintArrow, setHintArrow] = useState<Arrow | null>(null);
  const [coachMode, setCoachMode] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('settings');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'amoled'>('dark');

  const { fen, turn, isGameOver, makeMove, history, undo, redo, redoStack, reset } = game;
  const { playSound } = useSound(soundEnabled);

  const [prevFen, setPrevFen] = useState(fen);
  const [prevGameMode, setPrevGameMode] = useState(gameMode);
  const [prevPlayerColor, setPrevPlayerColor] = useState(playerColor);

  if (fen !== prevFen || gameMode !== prevGameMode || playerColor !== prevPlayerColor) {
    setPrevFen(fen);
    setPrevGameMode(gameMode);
    setPrevPlayerColor(playerColor);
    setHintArrow(null);
  }

  const currentFen = useMemo(() => {
    if (reviewMode) {
      if (reviewIndex === 0) {
        return history[0]?.before || fen;
      }
      return history[reviewIndex - 1]?.after || fen;
    }
    return fen;
  }, [reviewMode, reviewIndex, history, fen]);

  const activeGameInstance = useMemo(() => {
    if (currentFen !== fen) {
      return new Chess(currentFen);
    }
    return game.game;
  }, [currentFen, fen, game.game]);

  const {
    evalState,
    setEvalState,
    evalCache,
    setEvalCache,
    isThinking,
    evaluatePosition,
  } = useEngineOpponent({
    fen,
    turn,
    isGameOver,
    gameMode,
    playerColor,
    depth,
    makeMove,
    reviewMode,
  });

  const { liveAnalysis, moveClassification, currentArrows } = useLiveAnalysis({
    coachMode,
    evalCache,
    history,
    fen,
    reviewMode,
    reviewIndex,
    analysisResults,
    hintArrow,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('amoled', theme === 'amoled');
  }, [theme]);

  useEffect(() => {
    if (history.length === 0) return;
    const lastMove = history[history.length - 1];
    if (isGameOver) {
      playSound('gameOver');
    } else if (game.game.isCheck()) {
      playSound('check');
    } else if (lastMove.flags.includes('c') || lastMove.flags.includes('e')) {
      playSound('capture');
    } else {
      playSound('move');
    }
  }, [fen, history, isGameOver, game.game, playSound]);

  // Sound effects for review mode navigation
  const prevReviewIndex = useRef(reviewIndex);
  useEffect(() => {
    if (!reviewMode || reviewIndex === prevReviewIndex.current) {
      prevReviewIndex.current = reviewIndex;
      return;
    }

    if (reviewIndex === 0) {
      playSound('move');
    } else {
      const move = history[reviewIndex - 1];
      if (move) {
        if (move.flags.includes('c') || move.flags.includes('e')) {
          playSound('capture');
        } else {
          playSound('move');
        }
      }
    }
    prevReviewIndex.current = reviewIndex;
  }, [reviewMode, reviewIndex, history, playSound]);

  useEffect(() => {
    reset();
    setEvalState({ score: 0, isMate: false });
    setEvalCache({});
  }, [gameMode, playerColor, reset, setEvalState, setEvalCache]);

  useEffect(() => {
    if (isGameOver && history.length > 0 && !reviewMode) {
      const timer = setTimeout(() => setShowGameOverModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, history.length, reviewMode]);

  useEffect(() => {
    if (reviewMode && analysisResults.length > 0) {
      const res = analysisResults[reviewIndex];
      if (res) {
        setEvalState({ score: res.score, isMate: res.isMate });
      }
    }
  }, [reviewMode, reviewIndex, analysisResults, setEvalState]);

  const flipBoard = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  const handleUndo = useCallback(() => {
    if (gameMode === 'computer' && turn === playerColor && history.length >= 2) {
      undo(2);
    } else {
      undo(1);
    }
    setHintArrow(null);
  }, [gameMode, turn, playerColor, history.length, undo]);

  const handleHint = useCallback(() => {
    if (isGameOver || (gameMode === 'computer' && turn !== playerColor)) return;

    evaluatePosition(
      fen,
      10,
      (bestMove) => {
        const from = bestMove.substring(0, 2);
        const to = bestMove.substring(2, 4);
        setHintArrow({ startSquare: from, endSquare: to, color: 'rgba(255, 170, 0, 0.5)' });
        showToast('Hint shown on board', 'info');
      },
      (score, isMate) => {
        setEvalState({ score, isMate });
      },
    );
  }, [isGameOver, gameMode, turn, playerColor, fen, evaluatePosition, showToast, setEvalState]);

  const handleCopyFen = useCallback(() => {
    showToast('FEN copied to clipboard', 'success');
  }, [showToast]);

  const handleStartReview = useCallback(async () => {
    await startAnalysis(history);
    setReviewMode(true);
    setReviewIndex(0);
    setSidebarTab('analysis');
  }, [startAnalysis, history]);

  const handleExitReview = useCallback(() => {
    setReviewMode(false);
    setSidebarTab('moves');
  }, []);

  const handleNewGame = useCallback(() => {
    reset();
    setShowGameOverModal(false);
    setReviewMode(false);
    setSidebarTab('settings');
  }, [reset]);

  const handleReviewFromModal = useCallback(async () => {
    setShowGameOverModal(false);
    await handleStartReview();
  }, [handleStartReview]);

  const visualBoardOrientation = gameMode === 'computer'
    ? (playerColor === 'w' ? 'white' : 'black')
    : boardOrientation;

  const isWhiteBottom = visualBoardOrientation === 'white';
  const topPlayerColor: 'w' | 'b' = isWhiteBottom ? 'b' : 'w';
  const bottomPlayerColor: 'w' | 'b' = isWhiteBottom ? 'w' : 'b';

  const topCaptures = useMemo(() => getCapturedAndMaterial(activeGameInstance, topPlayerColor), [activeGameInstance, topPlayerColor]);
  const bottomCaptures = useMemo(() => getCapturedAndMaterial(activeGameInstance, bottomPlayerColor), [activeGameInstance, bottomPlayerColor]);

  const isTopBot = gameMode === 'computer' && playerColor !== topPlayerColor;
  const isBottomBot = gameMode === 'computer' && playerColor !== bottomPlayerColor;

  const gameOverInfo = useMemo(() => {
    if (game.isCheckmate) {
      return { result: 'checkmate' as const, winner: (turn === 'w' ? 'b' : 'w') as 'w' | 'b' };
    }
    if (game.isStalemate) {
      return { result: 'stalemate' as const };
    }
    return { result: 'draw' as const, reason: 'by agreement or rule' };
  }, [game.isCheckmate, game.isStalemate, turn]);

  const statusText = useMemo(() => {
    const gameOverText = getGameOverStatusText(game.isCheckmate, game.isStalemate, turn);
    return game.isDraw ? 'Game Over — Draw' : gameOverText || `${turn === 'w' ? 'White' : 'Black'}'s turn`;
  }, [game.isCheckmate, game.isStalemate, game.isDraw, turn]);

  return {
    game,
    isAnalyzing,
    progress,
    analysisResults,
    cancelAnalysis,
    boardOrientation,
    gameMode,
    setGameMode,
    playerColor,
    setPlayerColor,
    depth,
    setDepth,
    coachMode,
    setCoachMode,
    reviewMode,
    reviewIndex,
    setReviewIndex,
    showGameOverModal,
    setShowGameOverModal,
    sidebarTab,
    setSidebarTab,
    soundEnabled,
    setSoundEnabled,
    theme,
    setTheme,
    currentFen,
    activeGameInstance,
    evalState,
    isThinking,
    liveAnalysis,
    moveClassification,
    currentArrows,
    flipBoard,
    handleUndo,
    handleHint,
    handleCopyFen,
    handleStartReview,
    handleExitReview,
    handleNewGame,
    handleReviewFromModal,
    visualBoardOrientation,
    topPlayerColor,
    bottomPlayerColor,
    topCaptures,
    bottomCaptures,
    isTopBot,
    isBottomBot,
    gameOverInfo,
    statusText,
    fen,
    turn,
    isGameOver,
    makeMove,
    history,
    undo,
    redo,
    redoStack,
    reset,
  };
}
