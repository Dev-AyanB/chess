import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
};

/** Sort order so captured pieces display in a consistent hierarchy (queen → pawn). */
const PIECE_ORDER: Record<string, number> = {
  q: 0,
  r: 1,
  b: 2,
  n: 3,
  p: 4,
};

interface PlayerBarProps {
  /** Display name, e.g. "White", "Black", "You" */
  name: string;
  /** Player piece color */
  color: 'w' | 'b';
  /** Whether it's this player's turn */
  isActive: boolean;
  /** Show bot badge */
  isBot?: boolean;
  /** Engine depth level shown in bot badge */
  botLevel?: number;
  /** Show animated thinking indicator */
  isThinking?: boolean;
  /** Array of captured piece types, e.g. ['p', 'p', 'n'] */
  capturedPieces: string[];
  /** Material advantage, e.g. +3 */
  materialAdvantage: number;
  /** Which side of the board this bar sits on */
  position: 'top' | 'bottom';
}

function ThinkingDots() {
  return (
    <span
      className="inline-flex items-center gap-0.5 ml-2"
      role="status"
      aria-live="polite"
      aria-label="Thinking"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1 h-1 rounded-full bg-accent"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

export function PlayerBar({
  name,
  color,
  isActive,
  isBot = false,
  botLevel,
  isThinking = false,
  capturedPieces,
  materialAdvantage,
  position,
}: PlayerBarProps) {
  const sortedCaptures = [...capturedPieces].sort(
    (a, b) => (PIECE_ORDER[a] ?? 5) - (PIECE_ORDER[b] ?? 5)
  );

  const ariaLabel = [
    `${name}`,
    `playing ${color === 'w' ? 'white' : 'black'}`,
    isActive ? 'current turn' : '',
    isBot ? `bot level ${botLevel ?? '?'}` : '',
    isThinking ? 'thinking' : '',
    capturedPieces.length > 0
      ? `captured ${capturedPieces.length} piece${capturedPieces.length !== 1 ? 's' : ''}`
      : '',
    materialAdvantage > 0 ? `plus ${materialAdvantage} material` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <motion.div
      className={`
        glass-subtle rounded-xl py-2.5 px-4
        flex items-center justify-between gap-3
        transition-all duration-300 relative overflow-hidden
        ${position === 'top' ? 'mb-1.5' : 'mt-1.5'}
      `}
      style={
        isActive
          ? {
              borderLeftWidth: '2px',
              borderLeftColor: 'var(--color-accent)',
              boxShadow: `
                inset 3px 0 12px -4px var(--color-accent-glow),
                0 0 16px -4px var(--color-accent-glow)
              `,
            }
          : undefined
      }
      initial={{ opacity: 0, y: position === 'top' ? -6 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      role="region"
      aria-label={ariaLabel}
    >
      {/* ─── Left: Identity ─── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              w-7 h-7 rounded-full flex items-center justify-center
              ${
                color === 'w'
                  ? 'bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.15)]'
                  : 'bg-bg-deep border border-text-muted/30 shadow-[0_0_6px_rgba(0,0,0,0.3)]'
              }
            `}
            aria-hidden="true"
          >
            <span
              className={`text-xs font-bold leading-none ${
                color === 'w' ? 'text-gray-900' : 'text-text-muted'
              }`}
            >
              {name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Active dot indicator */}
          <AnimatePresence>
            {isActive && (
              <motion.span
                className="absolute -bottom-0.5 -right-0.5 block w-2 h-2 rounded-full bg-accent animate-breathe"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Name */}
        <span className="text-sm font-semibold text-text truncate">{name}</span>

        {/* Bot badge */}
        <AnimatePresence>
          {isBot && (
            <motion.span
              className="
                inline-flex items-center gap-1 px-2 py-0.5
                rounded-full text-xs font-medium
                bg-accent/15 text-accent border border-accent/20
              "
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Bot className="w-3 h-3" aria-hidden="true" />
              BOT{botLevel != null ? ` Lvl ${botLevel}` : ''}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Thinking indicator */}
        <AnimatePresence>
          {isThinking && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ThinkingDots />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Right: Captured pieces & material ─── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {sortedCaptures.length > 0 && (
          <div className="flex items-center -space-x-0.5" aria-hidden="true">
            {sortedCaptures.map((piece, i) => {
              const isWhitePiece = color === 'b';
              const fill = isWhitePiece ? 'var(--color-captured-white)' : 'var(--color-captured-black)';
              const stroke = isWhitePiece ? 'var(--stroke-captured-white)' : 'var(--stroke-captured-black)';
              return (
                <span
                  key={`${piece}-${i}`}
                  className="text-base leading-none"
                  style={{
                    color: fill,
                    textShadow: `-0.75px -0.75px 0 ${stroke}, 0.75px -0.75px 0 ${stroke}, -0.75px 0.75px 0 ${stroke}, 0.75px 0.75px 0 ${stroke}`,
                  }}
                >
                  {PIECE_SYMBOLS[piece] ?? piece}
                </span>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {materialAdvantage > 0 && (
            <motion.span
              className="text-xs font-semibold font-chess"
              style={{ color: 'var(--color-best)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            >
              +{materialAdvantage}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
