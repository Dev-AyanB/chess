import { useEffect, useRef, useCallback } from 'react';
import { Move } from 'chess.js';
import type { AnalysisResult, MoveClassification } from '../hooks/useGameReview';
import { CLASSIFICATION_DETAILS } from '../utils/chessUtils';

interface MoveHistoryProps {
  history: Move[];
  analysisResults?: AnalysisResult[];
  currentMoveIndex?: number;
  onMoveClick?: (moveIndex: number) => void;
}

function ClassificationDot({ classification }: { classification?: MoveClassification }) {
  const config = classification ? CLASSIFICATION_DETAILS[classification] : null;
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold text-white ml-1 shrink-0 ${config.colorClass}`}
      title={config.label}
      aria-label={config.label}
    >
      {config.symbol}
    </span>
  );
}

export function MoveHistory({ history, analysisResults, currentMoveIndex, onMoveClick }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active move
  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentMoveIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!onMoveClick || currentMoveIndex === undefined) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentMoveIndex > 0) onMoveClick(currentMoveIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentMoveIndex < history.length) onMoveClick(currentMoveIndex + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onMoveClick(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onMoveClick(history.length);
    }
  }, [onMoveClick, currentMoveIndex, history.length]);

  // Group moves into pairs (White, Black)
  const groupedMoves: { white: Move; whiteIndex: number; black?: Move; blackIndex: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    groupedMoves.push({
      white: history[i],
      whiteIndex: i,
      black: history[i + 1],
      blackIndex: i + 1,
    });
  }

  const isClickable = !!onMoveClick;

  const renderMove = (move: Move | undefined, moveIndex: number) => {
    if (!move) return <div className="flex-1" />;

    const isActive = currentMoveIndex !== undefined && currentMoveIndex === moveIndex + 1;
    const classification = analysisResults?.[moveIndex + 1]?.classification;

    const className = [
      'flex-1 flex items-center font-chess text-sm py-1 px-2 rounded-md transition-all duration-150',
      isClickable ? 'cursor-pointer' : '',
      isActive
        ? 'bg-[var(--color-accent-subtle)] text-text font-semibold ring-1 ring-[var(--color-accent)]/30'
        : 'text-text-muted hover:text-text',
      isClickable && !isActive ? 'hover:bg-surface-hover/50' : '',
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={isActive ? activeMoveRef : undefined}
        className={className}
        onClick={() => onMoveClick?.(moveIndex + 1)}
        tabIndex={isClickable ? 0 : -1}
        type="button"
        aria-label={`Move ${Math.floor(moveIndex / 2) + 1}${move.color === 'w' ? '.' : '...'} ${move.san}${classification ? ` (${classification})` : ''}`}
        aria-current={isActive ? 'step' : undefined}
      >
        <span className="truncate">{move.san}</span>
        <ClassificationDot classification={classification} />
      </button>
    );
  };

  return (
    <div
      className="flex flex-col bg-bg-deep/50 rounded-xl h-full overflow-hidden w-full border border-border"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-bg-elevated/50 px-4 py-2.5 font-semibold text-xs uppercase tracking-wider border-b border-border text-text-muted flex items-center gap-2">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Moves
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-1.5 custom-scrollbar"
        role="list"
        aria-label="Move history"
      >
        {groupedMoves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary py-8">
            <svg className="w-8 h-8 mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-sm">No moves yet</span>
            <span className="text-xs mt-0.5 opacity-60">Make a move to begin</span>
          </div>
        ) : (
          groupedMoves.map((turn, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 py-0.5 rounded-lg"
              role="listitem"
            >
              <div className="w-7 text-text-tertiary font-chess text-xs text-right pr-1 shrink-0 select-none">
                {idx + 1}.
              </div>
              {renderMove(turn.white, turn.whiteIndex)}
              {renderMove(turn.black, turn.blackIndex)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
