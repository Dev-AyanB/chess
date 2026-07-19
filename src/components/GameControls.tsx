import { RotateCcw, Undo2, Redo2, ArrowUpDown, Copy, Lightbulb, Check, FileText } from 'lucide-react';
import { useState, useCallback } from 'react';

interface GameControlsProps {
  fen: string;
  pgn: string;
  historyLength: number;
  canRedo: boolean;
  undo: (levels?: number) => void;
  reset: () => void;
  onFlipBoard: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onHint?: () => void;
  onCopyFen?: () => void;
  disabled?: boolean;
}

function ControlButton({
  onClick,
  icon: Icon,
  label,
  variant = 'default',
  disabled = false,
  active = false,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ size: number }>;
  label: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200',
        'border border-border shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
        disabled
          ? 'opacity-30 cursor-not-allowed bg-surface'
          : variant === 'danger'
          ? 'bg-surface text-[var(--color-blunder)] hover:bg-[var(--color-blunder)] hover:text-white hover:border-transparent'
          : active
          ? 'bg-[var(--color-accent)] text-white border-transparent'
          : 'bg-surface text-text-muted hover:bg-surface-hover hover:text-text',
      ].join(' ')}
      aria-label={label}
      title={label}
      type="button"
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function GameControls({
  fen,
  pgn,
  historyLength,
  canRedo,
  undo,
  reset,
  onFlipBoard,
  onUndo,
  onRedo,
  onHint,
  onCopyFen,
  disabled = false,
}: GameControlsProps) {
  const [copiedFen, setCopiedFen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const copyFen = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopiedFen(true);
      onCopyFen?.();
      setTimeout(() => setCopiedFen(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fen;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedFen(true);
      onCopyFen?.();
      setTimeout(() => setCopiedFen(false), 2000);
    }
  }, [fen, onCopyFen]);

  const copyPgn = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = pgn;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    }
  }, [pgn]);

  const handleRestart = useCallback(() => {
    if (historyLength > 0 && !showConfirm) {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }
    reset();
    setShowConfirm(false);
  }, [historyLength, showConfirm, reset]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Main toolbar */}
      <div className="flex flex-wrap gap-2 w-full">
        <ControlButton
          onClick={onUndo || (() => undo(1))}
          icon={Undo2}
          label="Undo"
          disabled={disabled || historyLength === 0}
        />
        <ControlButton
          onClick={onRedo || (() => {})}
          icon={Redo2}
          label="Redo"
          disabled={disabled || !canRedo}
        />
        {onHint && (
          <ControlButton
            onClick={onHint}
            icon={Lightbulb}
            label="Hint"
            disabled={disabled}
          />
        )}
        <ControlButton
          onClick={onFlipBoard}
          icon={ArrowUpDown}
          label="Flip"
        />
        <ControlButton
          onClick={copyFen}
          icon={copiedFen ? Check : Copy}
          label={copiedFen ? 'Copied!' : 'FEN'}
          active={copiedFen}
        />
        <ControlButton
          onClick={copyPgn}
          icon={copiedPgn ? Check : FileText}
          label={copiedPgn ? 'Copied!' : 'PGN'}
          active={copiedPgn}
        />
      </div>

      {/* Restart button */}
      <button
        onClick={handleRestart}
        disabled={disabled && historyLength === 0}
        className={[
          'flex items-center justify-center gap-2 py-2.5 w-full rounded-xl text-sm font-semibold transition-all duration-200',
          'border shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blunder)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
          showConfirm
            ? 'bg-[var(--color-blunder)] text-white border-transparent animate-pulse'
            : 'bg-surface text-[var(--color-blunder)] border-border hover:bg-[var(--color-blunder)] hover:text-white hover:border-transparent',
        ].join(' ')}
        type="button"
      >
        <RotateCcw size={16} />
        <span>{showConfirm ? 'Tap again to confirm' : 'Restart Game'}</span>
      </button>
    </div>
  );
}
