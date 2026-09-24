import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './themeContextValue';
import { usePersistentState } from '../hooks/usePersistentState';

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistentState<Theme>('theme', 'light', isTheme);

  // useLayoutEffect: el atributo se aplica antes del primer pintado, sin parpadeo del tema claro
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}