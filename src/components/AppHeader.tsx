import { Sun, Moon, Zap } from 'lucide-react';

interface AppHeaderProps {
  statusText: string;
  theme: 'light' | 'dark' | 'amoled';
  onToggleTheme: () => void;
}

export function AppHeader({ statusText, theme, onToggleTheme }: AppHeaderProps) {
  return (
    <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
          Modern Chess
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          {statusText}
        </p>
      </div>
      <button
        onClick={onToggleTheme}
        className="p-2 rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-text transition-colors border border-border cursor-pointer"
        aria-label={`Toggle theme (current: ${theme})`}
        type="button"
      >
        {theme === 'light' && <Moon size={18} />}
        {theme === 'dark' && <Zap size={18} className="text-indigo-500 dark:text-indigo-400 animate-pulse" />}
        {theme === 'amoled' && <Sun size={18} />}
      </button>
    </div>
  );
}
