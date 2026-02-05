/**
 * Theme Store - Zustand
 * 
 * Manages theme state including:
 * - Light/dark mode
 * - System preference detection
 * - LocalStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  // Theme state
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  resolveTheme: () => void;
}

// Get initial resolved theme based on system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Apply theme to document
function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'system',
      resolvedTheme: 'light',

      // Set mode and resolve theme
      setMode: (mode) => {
        const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;
        set({ mode, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      // Toggle between light and dark
      toggleTheme: () => {
        const currentResolved = get().resolvedTheme;
        const newTheme = currentResolved === 'light' ? 'dark' : 'light';
        set({ mode: newTheme, resolvedTheme: newTheme });
        applyTheme(newTheme);
      },

      // Resolve theme based on current mode and system preference
      resolveTheme: () => {
        const { mode } = get();
        const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;
        set({ resolvedTheme });
        applyTheme(resolvedTheme);
      },
    }),
    {
      name: 'clawbrain-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration from storage
        if (state) {
          const resolvedTheme = state.mode === 'system' ? getSystemTheme() : state.mode;
          state.resolvedTheme = resolvedTheme;
          applyTheme(resolvedTheme);
        }
      },
    }
  )
);

// Initialize theme on client side
export function initTheme() {
  if (typeof window === 'undefined') return;
  
  const store = useThemeStore.getState();
  store.resolveTheme();
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (store.mode === 'system') {
      store.resolveTheme();
    }
  });
}
