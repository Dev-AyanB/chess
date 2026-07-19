import type { AnalysisResult } from '../hooks/useGameReview';
import { Move } from 'chess.js';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { CLASSIFICATION_DETAILS } from '../utils/chessUtils';

interface ReviewControlsProps {
  history: Move[];
  analysisResults: AnalysisResult[];
  reviewIndex: number;
  setReviewIndex: (index: number) => void;
}

const getBadgeColor = (classification?: string) => {
  if (classification && CLASSIFICATION_DETAILS[classification]) {
    return CLASSIFICATION_DETAILS[classification].colorClass;
  }
  return 'bg-surface';
};

export function ReviewControls({ history, analysisResults, reviewIndex, setReviewIndex }: ReviewControlsProps) {
  const handleFirst = () => setReviewIndex(0);
  const handlePrev = () => setReviewIndex(Math.max(0, reviewIndex - 1));
  const handleNext = () => setReviewIndex(Math.min(history.length, reviewIndex + 1));
  const handleLast = () => setReviewIndex(history.length);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
    else if (e.key === 'Home') { e.preventDefault(); handleFirst(); }
    else if (e.key === 'End') { e.preventDefault(); handleLast(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewIndex, history.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentResult = analysisResults[reviewIndex];

  return (
    <div className="w-full glass-subtle rounded-xl p-3 mt-3 flex justify-between items-center" role="toolbar" aria-label="Review navigation">
      <div className="flex items-center gap-3 min-w-0">
        {reviewIndex > 0 ? (
          <>
            <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] text-white shadow-sm ${getBadgeColor(currentResult?.classification)}`}>
              {currentResult?.classification || 'Move'}
            </span>
            <div className="text-text-muted text-sm truncate">
              Played: <span className="font-chess text-text text-sm font-semibold">{history[reviewIndex - 1].san}</span>
              {currentResult?.bestMove && (
                <span className="ml-3 hidden sm:inline-block">
                  Best: <span className="font-chess text-text text-sm font-semibold">{currentResult.bestMove}</span>
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="text-text-muted text-sm font-medium px-2">Starting Position</span>
        )}
      </div>

      <div className="flex gap-0.5 bg-bg-deep/50 rounded-lg p-0.5 border border-border shrink-0">
        {[
          { onClick: handleFirst, disabled: reviewIndex === 0, icon: ChevronFirst, label: 'First' },
          { onClick: handlePrev, disabled: reviewIndex === 0, icon: ChevronLeft, label: 'Previous' },
          { onClick: handleNext, disabled: reviewIndex === history.length, icon: ChevronRight, label: 'Next' },
          { onClick: handleLast, disabled: reviewIndex === history.length, icon: ChevronLast, label: 'Last' },
        ].map(({ onClick, disabled, icon: Icon, label }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={disabled}
            className="p-2 flex justify-center items-center rounded-md hover:bg-surface-hover disabled:opacity-20 transition-colors text-text"
            title={`${label} Move`}
            aria-label={`${label} move`}
            type="button"
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
