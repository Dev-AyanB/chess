import { Monitor, Users, Circle, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type GameMode = 'local' | 'computer';
export type PlayerColor = 'w' | 'b';

interface GameSettingsProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  playerColor: PlayerColor;
  setPlayerColor: (color: PlayerColor) => void;
  depth: number;
  setDepth: (depth: number) => void;
  coachMode: boolean;
  setCoachMode: (mode: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  disabled?: boolean;
}

const depthToElo: Record<number, number> = {
  1: 600, 2: 800, 3: 1000, 4: 1200, 5: 1400,
  6: 1600, 7: 1800, 8: 2000, 9: 2200, 10: 2400,
  11: 2600, 12: 2700, 13: 2800, 14: 2900, 15: 3000,
};

export function GameSettings({
  gameMode,
  setGameMode,
  playerColor,
  setPlayerColor,
  depth,
  setDepth,
  coachMode,
  setCoachMode,
  soundEnabled,
  setSoundEnabled,
  disabled = false,
}: GameSettingsProps) {
  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Game Mode */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Game Mode
        </h3>
        <div className="flex bg-bg-deep/50 p-1 rounded-xl border border-border">
          <button
            disabled={disabled}
            onClick={() => setGameMode('local')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              gameMode === 'local'
                ? 'bg-surface text-text shadow-md'
                : 'text-text-muted hover:text-text',
              disabled ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
            type="button"
          >
            <Users size={15} />
            Local
          </button>
          <button
            disabled={disabled}
            onClick={() => setGameMode('computer')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              gameMode === 'computer'
                ? 'bg-surface text-text shadow-md'
                : 'text-text-muted hover:text-text',
              disabled ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
            type="button"
          >
            <Monitor size={15} />
            Computer
          </button>
        </div>
        {disabled && (
          <p className="text-xs text-text-tertiary mt-1.5 pl-1">
            Restart the game to change settings
          </p>
        )}
      </div>

      {/* Computer-specific settings */}
      <AnimatePresence>
        {gameMode === 'computer' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5">
              {/* Play As */}
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Play As
                </h3>
                <div className="flex gap-2">
                  <button
                    disabled={disabled}
                    onClick={() => setPlayerColor('w')}
                    className={[
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium',
                      playerColor === 'w'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-text shadow-sm'
                        : 'border-transparent bg-bg-deep/50 text-text-muted hover:text-text hover:border-border',
                      disabled ? 'opacity-40 cursor-not-allowed' : '',
                    ].join(' ')}
                    type="button"
                  >
                    <Circle size={14} className="text-white fill-white" />
                    White
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => setPlayerColor('b')}
                    className={[
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium',
                      playerColor === 'b'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-text shadow-sm'
                        : 'border-transparent bg-bg-deep/50 text-text-muted hover:text-text hover:border-border',
                      disabled ? 'opacity-40 cursor-not-allowed' : '',
                    ].join(' ')}
                    type="button"
                  >
                    <CircleDot size={14} className="text-text-muted" />
                    Black
                  </button>
                </div>
              </div>

              {/* Engine Difficulty */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Engine Difficulty
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-chess text-[var(--color-accent)] font-semibold">
                      Lvl {depth}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      ~{depthToElo[depth]} ELO
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  disabled={disabled}
                  className={[
                    'w-full accent-[var(--color-accent)] h-2 rounded-full appearance-none',
                    'bg-bg-deep/50',
                    disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                  aria-label={`Engine difficulty level ${depth}, approximately ${depthToElo[depth]} ELO`}
                />
                <div className="flex justify-between text-xs text-text-tertiary mt-1.5">
                  <span>Beginner</span>
                  <span>Grandmaster</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Coach Toggle */}
      <div className="flex items-center justify-between p-3 bg-bg-deep/30 rounded-xl border border-border">
        <div>
          <h3 className="text-sm font-semibold text-text">Live Coach</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Show move feedback instantly
          </p>
        </div>
        <button
          onClick={() => setCoachMode(!coachMode)}
          role="switch"
          aria-checked={coachMode}
          aria-label="Toggle live coach mode"
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            coachMode
              ? 'bg-[var(--color-best)]'
              : 'bg-surface border border-border',
          ].join(' ')}
          type="button"
        >
          <motion.span
            className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
            animate={{ x: coachMode ? 24 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Sound Toggle */}
      <div className="flex items-center justify-between p-3 bg-bg-deep/30 rounded-xl border border-border">
        <div>
          <h3 className="text-sm font-semibold text-text">Sound Effects</h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Play sounds on moves and captures
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          role="switch"
          aria-checked={soundEnabled}
          aria-label="Toggle sound effects"
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            soundEnabled
              ? 'bg-[var(--color-accent)]'
              : 'bg-surface border border-border',
          ].join(' ')}
          type="button"
        >
          <motion.span
            className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
            animate={{ x: soundEnabled ? 24 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}
