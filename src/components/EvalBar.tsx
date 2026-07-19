import { motion } from 'framer-motion';

interface EvalBarProps {
  score: number;
  isMate: boolean;
  boardOrientation: 'white' | 'black';
}

export function EvalBar({ score, isMate, boardOrientation }: EvalBarProps) {
  let whitePercent: number;

  if (isMate) {
    whitePercent = score > 0 ? 100 : 0;
  } else {
    // Sigmoid-like mapping for smoother visual distribution
    const cappedScore = Math.max(-10, Math.min(10, score));
    whitePercent = 50 + (50 * (2 / (1 + Math.exp(-cappedScore * 0.7)) - 1));
    // Hard cap between 3% and 97% if not mate
    whitePercent = Math.max(3, Math.min(97, whitePercent));
  }

  const isWhiteBottom = boardOrientation === 'white';

  const formatEval = () => {
    if (isMate) {
      return `M${Math.abs(score)}`;
    }
    return score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
  };

  // Position the eval label near the boundary between white and black sections
  const labelPosition = isWhiteBottom ? (100 - whitePercent) : whitePercent;
  const clampedLabelPos = Math.max(8, Math.min(92, labelPosition));

  return (
    <div
      className="w-5 h-full relative"
      role="meter"
      aria-label={`Evaluation: ${formatEval()}`}
      aria-valuenow={score}
      aria-valuemin={-10}
      aria-valuemax={10}
    >
      {/* Colored bar container */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden flex flex-col"
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        {/* Top Section */}
        <motion.div
          className="w-full"
          animate={{
            height: `${isWhiteBottom ? (100 - whitePercent) : whitePercent}%`,
          }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            backgroundColor: isWhiteBottom ? 'var(--color-eval-black)' : 'var(--color-eval-white)',
          }}
        />
        {/* Bottom Section */}
        <motion.div
          className="w-full flex-1"
          style={{
            backgroundColor: isWhiteBottom ? 'var(--color-eval-white)' : 'var(--color-eval-black)',
          }}
        />
      </div>

      {/* Floating eval label badge outside overflow-hidden to prevent clipping */}
      <motion.div
        className="absolute left-1/2 flex items-center justify-center pointer-events-none z-10"
        animate={{ top: `${clampedLabelPos}%` }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <span
          className="font-chess text-[8px] font-bold leading-none px-1 py-0.5 rounded bg-[var(--color-bg-deep)] text-[var(--color-text)] border border-[rgba(255,255,255,0.12)] shadow-sm whitespace-nowrap"
        >
          {formatEval()}
        </span>
      </motion.div>
    </div>
  );
}
