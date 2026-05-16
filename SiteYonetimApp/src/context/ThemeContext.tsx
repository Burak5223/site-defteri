import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { applyThemeColors, colors, ThemeMode } from '../theme';

const THEME_STORAGE_KEY = 'themeMode';

interface ThemeContextValue {
  colors: typeof colors;
  isDarkMode: boolean;
  mode: ThemeMode;
  ready: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const nextMode: ThemeMode = storedMode === 'dark' ? 'dark' : 'light';
      applyThemeColors(nextMode);
      Appearance.setColorScheme(nextMode);
      setMode(nextMode);
      setReady(true);
    };

    loadTheme();
  }, []);

  const setDarkMode = async (enabled: boolean) => {
    const nextMode: ThemeMode = enabled ? 'dark' : 'light';
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyThemeColors(nextMode);
    Appearance.setColorScheme(nextMode);
    setMode(nextMode);
  };

  const value = useMemo(
    () => ({
      colors: { ...colors },
      isDarkMode: mode === 'dark',
      mode,
      ready,
      setDarkMode,
    }),
    [mode, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
