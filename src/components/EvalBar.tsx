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
      className="w-5 h-full rounded-full overflow-hidden flex flex-col relative"
      role="meter"
      aria-label={`Evaluation: ${formatEval()}`}
      aria-valuenow={score}
      aria-valuemin={-10}
      aria-valuemax={10}
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

      {/* Floating eval label */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
        animate={{ top: `${clampedLabelPos}%` }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{ transform: 'translateY(-50%)' }}
      >
        <span
          className="font-chess text-[9px] font-bold leading-none px-0.5 rounded-sm"
          style={{
            color: whitePercent > 50 ? 'var(--color-eval-black)' : 'var(--color-eval-white)',
            textShadow: whitePercent > 50
              ? '0 0 4px rgba(234,224,213,0.3)'
              : '0 0 4px rgba(42,37,32,0.3)',
          }}
        >
          {formatEval()}
        </span>
      </motion.div>
    </div>
  );
}
