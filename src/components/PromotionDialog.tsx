import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromotionDialogProps {
  isOpen: boolean;
  color: 'w' | 'b';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

interface PromotionOption {
  piece: 'q' | 'r' | 'b' | 'n';
  label: string;
  white: string;
  black: string;
}

const PROMOTION_OPTIONS: PromotionOption[] = [
  { piece: 'q', label: 'Queen', white: '♕', black: '♛' },
  { piece: 'r', label: 'Rook', white: '♖', black: '♜' },
  { piece: 'b', label: 'Bishop', white: '♗', black: '♝' },
  { piece: 'n', label: 'Knight', white: '♘', black: '♞' },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const pieceVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 22 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.1 } },
};

export default function PromotionDialog({
  isOpen,
  color,
  onSelect,
  onCancel,
}: PromotionDialogProps) {
  const queenRef = useRef<HTMLButtonElement>(null);

  // Auto-focus Queen button when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start before focusing
      const timer = setTimeout(() => {
        queenRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key to cancel
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={onCancel}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-label="Choose promotion piece"
          aria-modal="true"
        >
          {/* Picker container */}
          <motion.div
            className="glass flex flex-col items-center gap-3 rounded-xl p-4"
            onClick={(e) => e.stopPropagation()}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Piece buttons row */}
            <div className="flex gap-2">
              {PROMOTION_OPTIONS.map((option, index) => (
                <motion.button
                  key={option.piece}
                  ref={index === 0 ? queenRef : undefined}
                  className="glass-subtle flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-transparent text-4xl transition-colors hover:border-[var(--color-accent-glow)] focus-visible:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg)] md:h-16 md:w-16"
                  variants={pieceVariants}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(option.piece)}
                  aria-label={`Promote to ${option.label}`}
                  type="button"
                >
                  <span className="select-none leading-none drop-shadow-md">
                    {color === 'w' ? option.white : option.black}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Label */}
            <span className="text-text-muted text-xs select-none">
              Choose promotion piece
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
