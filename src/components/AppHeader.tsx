import { Sun, Moon } from 'lucide-react';

interface AppHeaderProps {
  statusText: string;
  theme: 'light' | 'dark';
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
        className="p-2 rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-text transition-colors border border-border"
        aria-label="Toggle theme"
        type="button"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}
