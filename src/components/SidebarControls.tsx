import { BarChart3 } from 'lucide-react';
import { Move } from 'chess.js';
import { GameControls } from './GameControls';

interface SidebarControlsProps {
  reviewMode: boolean;
  onExitReview: () => void;
  fen: string;
  pgn: string;
  history: Move[];
  canRedo: boolean;
  undo: (levels?: number) => void;
  reset: () => void;
  onFlipBoard: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onCopyFen: () => void;
  isGameOver: boolean;
  onStartReview: () => void;
  isAnalyzing: boolean;
}

export function SidebarControls({
  reviewMode,
  onExitReview,
  fen,
  pgn,
  history,
  canRedo,
  undo,
  reset,
  onFlipBoard,
  onUndo,
  onRedo,
  onHint,
  onCopyFen,
  isGameOver,
  onStartReview,
  isAnalyzing,
}: SidebarControlsProps) {
  return (
    <div className="p-4 border-t border-border shrink-0">
      {reviewMode ? (
        <button
          onClick={onExitReview}
          className="w-full py-3 bg-[var(--color-blunder)] hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg uppercase tracking-wider"
          type="button"
        >
          Exit Review
        </button>
      ) : (
        <>
          <GameControls
            fen={fen}
            pgn={pgn}
            historyLength={history.length}
            canRedo={canRedo}
            undo={undo}
            reset={reset}
            onFlipBoard={onFlipBoard}
            onUndo={onUndo}
            onRedo={onRedo}
            onHint={onHint}
            onCopyFen={onCopyFen}
            disabled={isGameOver}
          />
          {isGameOver && history.length > 0 && (
            <button
              onClick={onStartReview}
              disabled={isAnalyzing}
              className="w-full py-3 mt-3 text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
              }}
              type="button"
            >
              <BarChart3 size={18} />
              Review Game
            </button>
          )}
        </>
      )}
    </div>
  );
}
