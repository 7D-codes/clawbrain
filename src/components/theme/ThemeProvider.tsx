/**
 * ThemeProvider - Initializes theme on app mount
 */

'use client';

import { useEffect } from 'react';
import { initTheme } from '@/stores/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    initTheme();
  }, []);

  return <>{children}</>;
}
