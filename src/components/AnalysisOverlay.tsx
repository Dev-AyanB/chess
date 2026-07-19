interface AnalysisOverlayProps {
  isAnalyzing: boolean;
  progress: number;
  cancelAnalysis: () => void;
}

export function AnalysisOverlay({ isAnalyzing, progress, cancelAnalysis }: AnalysisOverlayProps) {
  if (!isAnalyzing) return null;

  return (
    <div className="absolute inset-0 z-20 bg-bg-deep/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
      <div className="text-lg font-bold text-text mb-4">Analyzing Game...</div>
      <div className="w-56 h-3 bg-surface rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-text-muted text-sm font-chess">{progress}%</div>
      <button
        onClick={cancelAnalysis}
        className="mt-4 px-4 py-2 bg-[var(--color-blunder)] hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}
