import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, Platform } from 'react-native';

/**
 * LMS design system — cool neutrals, electric indigo primary, emerald succeed, warm amber accents.
 * Use theme.* in components; avoid hard-coded hex in screens.
 */
export const colors = {
  light: {
    background: '#F0F3FA',
    surface: '#E8EDF6',
    card: '#FFFFFF',
    text: '#0B1220',
    textSecondary: '#5A6678',
    textTertiary: '#8B95A5',
    primary: '#5B4DFF',
    primaryDark: '#4338CA',
    primarySoft: '#EEF2FF',
    secondary: '#0D9F7A',
    secondarySoft: '#D1FAE5',
    accent: '#F59E0B',
    accentSoft: '#FEF3C7',
    border: '#E1E6EF',
    borderLight: '#EEF1F7',
    inputBg: '#F8FAFC',
    shadow: 'rgba(11, 18, 32, 0.08)',
    overlay: 'rgba(11, 18, 32, 0.5)',
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    info: '#0284C7',
    /** Hero gradients (simulate with layered Views) */
    heroTop: '#5B4DFF',
    heroBottom: '#7C3AED',
    fabShadow: 'rgba(91, 77, 255, 0.35)',
    radiusSm: 10,
    radiusMd: 14,
    radiusLg: 20,
    radiusXl: 28,
  },
  dark: {
    background: '#0B0F17',
    surface: '#12192A',
    card: '#161E30',
    text: '#F4F6FA',
    textSecondary: '#A8B0C0',
    textTertiary: '#6B7280',
    primary: '#818CF8',
    primaryDark: '#6366F1',
    primarySoft: '#252B45',
    secondary: '#34D399',
    secondarySoft: '#064E3B',
    accent: '#FBBF24',
    accentSoft: '#78350F',
    border: '#2A3548',
    borderLight: '#1F2937',
    inputBg: '#1A2235',
    shadow: 'rgba(0, 0, 0, 0.45)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#38BDF8',
    heroTop: '#4F46E5',
    heroBottom: '#6D28D9',
    fabShadow: 'rgba(0, 0, 0, 0.5)',
    radiusSm: 10,
    radiusMd: 14,
    radiusLg: 20,
    radiusXl: 28,
  },
};

import { DefaultTheme, DarkTheme } from '@react-navigation/native';

/** React Navigation theme aligned to our palette */
export const navThemeFrom = (theme, isDark) => {
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.accent,
    },
  };
};

export const cardShadowStyle = (theme) =>
  Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: {},
    web: {
      boxShadow: '0 8px 32px rgba(11, 18, 32, 0.07)',
    },
  });

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, []);

  const toggleTheme = () => setIsDarkMode((v) => !v);
  const theme = isDarkMode ? colors.dark : colors.light;

  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
