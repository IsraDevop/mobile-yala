import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const palette = {
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  secondary: "#EA580C",
  secondaryLight: "#FED7AA",
  background: "#F5F4F0",
  surface: "#FFFFFF",
  error: "#DC2626",
  success: "#16A34A",
  textPrimary: "#1C1C1E",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  badge: "#EF4444",
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    primaryContainer: "#EDE9FE",
    secondary: palette.secondary,
    secondaryContainer: palette.secondaryLight,
    background: palette.background,
    surface: palette.surface,
    error: palette.error,
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onBackground: palette.textPrimary,
    onSurface: palette.textPrimary,
    outline: palette.border,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#A78BFA",
    primaryContainer: "#5B21B6",
    secondary: "#FB923C",
    background: "#0F0F0F",
    surface: "#1C1C1E",
    error: palette.error,
  },
};

export { palette };
