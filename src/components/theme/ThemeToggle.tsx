/**
 * ThemeToggle - Dark mode toggle button
 */

'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const modeConfig: Record<ThemeMode, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light' },
  dark: { icon: Moon, label: 'Dark' },
  system: { icon: Monitor, label: 'System' },
};

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { mode, resolvedTheme, toggleTheme, setMode } = useThemeStore();
  
  const ResolvedIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Simple toggle button */}
      <button
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-xs font-mono',
          'border border-border bg-background',
          'hover:bg-accent hover:border-border-strong',
          'transition-colors'
        )}
        title={`Theme: ${mode} (resolved: ${resolvedTheme})`}
      >
        <ResolvedIcon className="h-4 w-4" />
        {showLabel && (
          <span className="uppercase">{resolvedTheme}</span>
        )}
      </button>
    </div>
  );
}

export function ThemeSelector({ className }: { className?: string }) {
  const { mode, setMode } = useThemeStore();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        Theme
      </span>
      <div className="flex border border-border">
        {(Object.keys(modeConfig) as ThemeMode[]).map((themeMode) => {
          const { icon: Icon, label } = modeConfig[themeMode];
          const isActive = mode === themeMode;
          
          return (
            <button
              key={themeMode}
              onClick={() => setMode(themeMode)}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono',
                'border-r border-border last:border-r-0',
                'transition-colors flex-1',
                isActive
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:bg-accent'
              )}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline uppercase">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
