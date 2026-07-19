import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Minus, Handshake, RotateCcw, BarChart3, X } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  result: 'checkmate' | 'stalemate' | 'draw' | 'resignation';
  winner?: 'w' | 'b';
  reason?: string;
  onNewGame: () => void;
  onReviewGame: () => void;
  onClose: () => void;
}

interface ResultConfig {
  icon: React.ElementType;
  iconColor: string;
  iconGlow: string;
  heading: string;
}

function getResultConfig(result: GameOverModalProps['result'], winner?: 'w' | 'b'): ResultConfig {
  switch (result) {
    case 'checkmate':
    case 'resignation':
      return winner
        ? {
            icon: Crown,
            iconColor: 'text-amber-400',
            iconGlow: 'drop-shadow-[0_0_16px_rgba(251,191,36,0.5)]',
            heading: result === 'checkmate' ? 'Checkmate!' : 'Resignation!',
          }
        : {
            icon: Shield,
            iconColor: 'text-red-400',
            iconGlow: 'drop-shadow-[0_0_16px_rgba(248,113,113,0.5)]',
            heading: result === 'checkmate' ? 'Checkmate!' : 'Resignation!',
          };
    case 'stalemate':
      return {
        icon: Minus,
        iconColor: 'text-yellow-400',
        iconGlow: 'drop-shadow-[0_0_16px_rgba(250,204,21,0.5)]',
        heading: 'Stalemate!',
      };
    case 'draw':
      return {
        icon: Handshake,
        iconColor: 'text-blue-400',
        iconGlow: 'drop-shadow-[0_0_16px_rgba(96,165,250,0.5)]',
        heading: 'Draw!',
      };
  }
}

function getDetailText(result: GameOverModalProps['result'], winner?: 'w' | 'b', reason?: string): string {
  const winnerName = winner === 'w' ? 'White' : winner === 'b' ? 'Black' : null;

  if (result === 'checkmate' && winnerName) {
    return `${winnerName} wins by checkmate`;
  }
  if (result === 'resignation' && winnerName) {
    return `${winnerName} wins by resignation`;
  }
  if (result === 'stalemate') {
    return reason ? `Stalemate ${reason}` : 'Game ended in stalemate';
  }
  if (result === 'draw') {
    return reason ? `Draw ${reason}` : 'Game ended in a draw';
  }

  return 'Game over';
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      delay: 0.15,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
      delay: 0.25 + i * 0.08,
    },
  }),
};

export function GameOverModal({
  isOpen,
  result,
  winner,
  reason,
  onNewGame,
  onReviewGame,
  onClose,
}: GameOverModalProps) {
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const config = getResultConfig(result, winner);
  const detail = getDetailText(result, winner, reason);
  const Icon = config.icon;

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap + escape key
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus the review button after animation settles
    const timer = setTimeout(() => {
      reviewButtonRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, handleKeyDown]);

  // Trap focus within the modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-heading"
            className="glass w-full max-w-[400px] rounded-2xl p-8"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                className={`mb-4 ${config.iconColor} ${config.iconGlow}`}
                variants={iconVariants}
                initial="hidden"
                animate="visible"
              >
                <Icon size={64} strokeWidth={1.5} />
              </motion.div>

              {/* Result heading */}
              <h2
                id="game-over-heading"
                className="text-2xl font-bold text-text mb-1"
              >
                {config.heading}
              </h2>

              {/* Detail text */}
              <p className="text-text-muted text-sm">
                {detail}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 w-full mt-6">
                <motion.button
                  ref={reviewButtonRef}
                  onClick={onReviewGame}
                  custom={0}
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-center gap-2 py-3 w-full rounded-xl text-base font-semibold text-white transition-all duration-200 shadow-lg cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 24px var(--color-accent-glow)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BarChart3 size={20} />
                  <span>Review Game</span>
                </motion.button>

                <motion.button
                  onClick={onNewGame}
                  custom={1}
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-center gap-2 py-3 w-full rounded-xl text-base font-semibold text-text bg-transparent border border-border hover:bg-surface-hover transition-colors duration-200 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw size={20} />
                  <span>New Game</span>
                </motion.button>

                <motion.button
                  onClick={onClose}
                  custom={2}
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-center gap-1.5 py-2 w-full text-sm text-text-tertiary hover:text-text-muted transition-colors duration-200 cursor-pointer bg-transparent border-none"
                  whileTap={{ scale: 0.97 }}
                >
                  <X size={14} />
                  <span>Dismiss</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
