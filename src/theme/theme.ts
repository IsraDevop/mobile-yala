import { MD3LightTheme, MD3DarkTheme, configureFonts } from "react-native-paper";

const palette = {
  primary: "#0E28D6",
  primaryDark: "#0A1FAE",
  primaryContainer: "#EEF0FE",
  avatarBg: "#EDEBFF",
  secondary: "#F2622E",
  secondaryLight: "#FCDED1",
  secondaryBg: "#FFF4EF",
  background: "#F5F6F8",
  surface: "#FFFFFF",
  error: "#C8413A",
  success: "#1B9E5A",
  successBg: "#E9F7EF",
  warning: "#C7891A",
  warningBg: "#FFF6E8",
  textPrimary: "#15161A",
  textSecondary: "#7C808B",
  textTertiary: "#9499A3",
  border: "#E4E6EC",
  borderLight: "#F0F1F4",
  fill: "#F1F2F5",
  star: "#F4A623",
  badge: "#F2622E",
  dark: "#15161A",
};

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
  monoExtra: "JetBrainsMono_800ExtraBold",
};

const baseFont = {
  fontFamily: fonts.regular,
  fontWeight: "400" as const,
  letterSpacing: 0,
  lineHeight: 20,
  fontSize: 14,
};

const paperFonts = configureFonts({
  config: {
    displayLarge: { ...baseFont, fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40 },
    displayMedium: { ...baseFont, fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34 },
    displaySmall: { ...baseFont, fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
    headlineLarge: { ...baseFont, fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32 },
    headlineMedium: { ...baseFont, fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28 },
    headlineSmall: { ...baseFont, fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
    titleLarge: { ...baseFont, fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
    titleMedium: { ...baseFont, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
    titleSmall: { ...baseFont, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
    bodyLarge: { ...baseFont, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
    bodyMedium: { ...baseFont, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
    bodySmall: { ...baseFont, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
    labelLarge: { ...baseFont, fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
    labelMedium: { ...baseFont, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
    labelSmall: { ...baseFont, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  },
});

export const lightTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    primaryContainer: palette.primaryContainer,
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

export const darkTheme = lightTheme;

export { palette };
