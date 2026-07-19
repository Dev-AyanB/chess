import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import PromotionDialog from './PromotionDialog';
import { CLASSIFICATION_DETAILS } from '../utils/chessUtils';

interface ChessBoardProps {
  gameInstance: Chess;
  fen: string;
  makeMove: (move: { from: string; to: string; promotion?: string }) => boolean;
  boardOrientation: 'white' | 'black';
  arrows?: { startSquare: string; endSquare: string; color: string }[];
  overrideFen?: string;
  isReviewMode?: boolean;
  moveClassification?: { square: string; classification: string } | null;
}

const getBadgeSymbolAndColor = (classification: string) => {
  const detail = CLASSIFICATION_DETAILS[classification];
  if (!detail) return null;
  return { symbol: detail.symbol, color: detail.colorClass };
};

interface PendingPromotion {
  from: string;
  to: string;
}

export function ChessBoard({ gameInstance, fen, makeMove, boardOrientation, arrows = [], overrideFen, isReviewMode, moveClassification }: ChessBoardProps) {
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, { backgroundColor: string } | undefined>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, Record<string, string>>>({});
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const [prevFen, setPrevFen] = useState(fen);
  const [prevOverrideFen, setPrevOverrideFen] = useState(overrideFen);

  if (fen !== prevFen || overrideFen !== prevOverrideFen) {
    setPrevFen(fen);
    setPrevOverrideFen(overrideFen);
    setMoveFrom(null);
    setOptionSquares({});
  }

  const isPromotionMove = useCallback((from: string, to: string): boolean => {
    const piece = gameInstance.get(from as never);
    if (!piece || piece.type !== 'p') return false;
    return (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1');
  }, [gameInstance]);

  function getMoveOptions(square: string) {
    if (isReviewMode) return false;
    const moves = gameInstance.moves({
      square: square as never,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, Record<string, string>> = {};
    moves.forEach((move) => {
      const targetPiece = gameInstance.get(move.to as never);
      const sourcePiece = gameInstance.get(square as never);
      newSquares[move.to] = {
        background:
          targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onPieceDragBegin({ square }: { square: string }) {
    if (isReviewMode) return;
    getMoveOptions(square);
  }

  function onSquareClick({ square }: { square: string }) {
    if (isReviewMode) return;
    setRightClickedSquares({});

    // Check self-selection
    if (square === moveFrom) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    // Check for promotion
    if (isPromotionMove(moveFrom, square)) {
      setPendingPromotion({ from: moveFrom, to: square });
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // to square — try the move
    const isValidMove = makeMove({ from: moveFrom, to: square });

    if (!isValidMove) {
      // check if clicked on another piece to select it
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
      return;
    }

    setMoveFrom(null);
    setOptionSquares({});
  }

  function onSquareRightClick({ square }: { square: string }) {
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares((prev) => ({
      ...prev,
      [square]:
        prev[square] && prev[square]?.backgroundColor === colour
          ? undefined
          : { backgroundColor: colour },
    }));
  }

  function onPieceDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null; piece: string }) {
    // Clear selection and option squares for all drop outcomes
    setMoveFrom(null);
    setOptionSquares({});

    if (isReviewMode || !targetSquare) return false;

    // Check for promotion
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return false; // Don't complete the move yet — wait for dialog
    }

    const move = makeMove({ from: sourceSquare, to: targetSquare });
    return move;
  }

  const handlePromotionSelect = useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    makeMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
    setPendingPromotion(null);
    setMoveFrom(null);
    setOptionSquares({});
  }, [pendingPromotion, makeMove]);

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
    setMoveFrom(null);
    setOptionSquares({});
  }, []);

  const customSquareRenderer = (props: { square: string; children?: React.ReactNode }) => {
    const { square, children } = props;
    const badge = moveClassification?.square === square ? getBadgeSymbolAndColor(moveClassification.classification) : null;

    const optionStyle = optionSquares[square] || {};
    const rightClickStyle = rightClickedSquares[square] || {};
    const combinedStyle = { ...optionStyle, ...rightClickStyle };

    return (
      <div className="relative w-full h-full" style={combinedStyle}>
        {children}
        {badge && (
          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-bg-deep z-[100] animate-pop-in ${badge.color}`}>
            {badge.symbol}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl relative">
      <Chessboard
        options={{
          position: overrideFen || fen,
          onPieceDrop: onPieceDrop as never,
          onSquareClick: onSquareClick,
          onSquareRightClick: onSquareRightClick,
          onSquareMouseDown: onPieceDragBegin,
          boardOrientation: boardOrientation,
          darkSquareStyle: { backgroundColor: 'var(--color-board-dark)' },
          lightSquareStyle: { backgroundColor: 'var(--color-board-light)' },
          dropSquareStyle: { boxShadow: 'inset 0 0 1px 6px rgba(255,255,255,0.75)' },
          squareStyles: {
            ...optionSquares,
            ...rightClickedSquares,
          } as Record<string, React.CSSProperties>,
          arrows: arrows as never,
          animationDurationInMs: 200,
          squareRenderer: customSquareRenderer,
        }}
      />
      <PromotionDialog
        isOpen={!!pendingPromotion}
        color={pendingPromotion ? (gameInstance.get(pendingPromotion.from as never)?.color ?? 'w') as 'w' | 'b' : 'w'}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
}
