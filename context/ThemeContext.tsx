import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getTheme,
  loadDarkModePreference,
  saveDarkModePreference,
} from "../utils/theme";

export type AppColors = ReturnType<typeof getTheme>;

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  setDarkMode: (next: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialDarkMode,
}: {
  children: ReactNode;
  initialDarkMode: boolean;
}) {
  const [isDark, setIsDark] = useState(initialDarkMode);

  const setDarkMode = useCallback(async (next: boolean) => {
    setIsDark(next);
    await saveDarkModePreference(next);
  }, []);

  const colors = useMemo(() => getTheme(isDark), [isDark]);

  const value = useMemo(
    () => ({ colors, isDark, setDarkMode }),
    [colors, isDark, setDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx == null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export { loadDarkModePreference };
