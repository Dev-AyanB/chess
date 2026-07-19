import { Move } from 'chess.js';
import type { AnalysisResult } from '../hooks/useGameReview';
import { motion } from 'framer-motion';
import { CLASSIFICATION_DETAILS } from '../utils/chessUtils';

interface GameReportProps {
  history: Move[];
  analysisResults: AnalysisResult[];
}

const CLASSIFICATIONS_TO_SHOW = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'] as const;

function Row({ label, colorClass, wVal, bVal, maxVal }: {
  label: string;
  colorClass: string;
  wVal: number;
  bVal: number;
  maxVal: number;
}) {
  const barWidth = (val: number) => maxVal > 0 ? `${(val / maxVal) * 100}%` : '0%';

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* White bar + count */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-sm font-chess font-semibold text-text w-5 text-right">
          {wVal}
        </span>
        <div className="w-16 h-2 bg-bg-deep/50 rounded-full overflow-hidden rotate-180">
          <motion.div
            className={`h-full rounded-full ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: barWidth(wVal) }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
      </div>

      {/* Label with dot */}
      <div className="flex items-center gap-1.5 w-24 justify-center shrink-0">
        <span className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
        <span className="text-xs text-text-muted font-medium">{label}</span>
      </div>

      {/* Black bar + count */}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-16 h-2 bg-bg-deep/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${colorClass}`}
            initial={{ width: 0 }}
            animate={{ width: barWidth(bVal) }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
        <span className="text-sm font-chess font-semibold text-text w-5">
          {bVal}
        </span>
      </div>
    </div>
  );
}

export function GameReport({ history, analysisResults }: GameReportProps) {
  const stats = {
    w: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    b: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  };

  history.forEach((move, i) => {
    const classification = analysisResults[i + 1]?.classification;
    if (classification) {
      const key = classification as keyof typeof stats.w;
      if (stats[move.color][key] !== undefined) {
        stats[move.color][key]++;
      } else if (classification === 'excellent' || classification === 'book') {
        stats[move.color].best++;
      }
    }
  });

  // Find max count for bar scaling
  const allVals = [...Object.values(stats.w), ...Object.values(stats.b)];
  const maxVal = Math.max(...allVals, 1);

  // Calculate accuracy (% of best + good moves)
  const wTotal = Object.values(stats.w).reduce((a, b) => a + b, 0);
  const bTotal = Object.values(stats.b).reduce((a, b) => a + b, 0);
  const wAccuracy = wTotal > 0 ? Math.round(((stats.w.best + stats.w.good) / wTotal) * 100) : 0;
  const bAccuracy = bTotal > 0 ? Math.round(((stats.b.best + stats.b.good) / bTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-bold text-center text-text uppercase tracking-wider">
        Game Report
      </h3>

      {/* Accuracy display */}
      <div className="flex justify-around items-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">White</span>
          <motion.span
            className="text-2xl font-bold font-chess text-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            {wAccuracy}%
          </motion.span>
          <span className="text-xs text-text-tertiary">accuracy</span>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Black</span>
          <motion.span
            className="text-2xl font-bold font-chess text-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
          >
            {bAccuracy}%
          </motion.span>
          <span className="text-xs text-text-tertiary">accuracy</span>
        </div>
      </div>

      {/* Classification bars */}
      <div className="bg-bg-deep/30 rounded-xl p-3 border border-border">
        {CLASSIFICATIONS_TO_SHOW.map((key) => {
          const detail = CLASSIFICATION_DETAILS[key];
          return (
            <Row
              key={key}
              label={detail.label}
              colorClass={detail.colorClass}
              wVal={stats.w[key]}
              bVal={stats.b[key]}
              maxVal={maxVal}
            />
          );
        })}
      </div>
    </div>
  );
}
