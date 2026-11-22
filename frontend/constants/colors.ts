import { Platform, StyleSheet } from "react-native";

// iOS system palette: grouped background, system fills, Apple system colors.
export const lightColors = {
  background: "#F2F2F7",
  card: "#FFFFFF",
  elevated: "#FFFFFF",
  accent: "#007AFF",
  accentAlt: "#5AC8FA",
  navy: "#000000",
  ink: "#1C1C1E",
  text: "#1C1C1E",
  muted: "#8E8E93",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  lightBlue: "#E5F0FF",
  border: "#E5E5EA",
  error: "#FF3B30",
  soft: "#F9F9FB",
  dangerSoft: "#FFF0EF",
  warningSoft: "#FFF4E0",
  successSoft: "#E8F9EF",
};

export type Palette = typeof lightColors;

export const darkColors: Palette = {
  background: "#000000",
  card: "#1C1C1E",
  elevated: "#2C2C2E",
  accent: "#0A84FF",
  accentAlt: "#64D2FF",
  navy: "#FFFFFF",
  ink: "#F2F2F7",
  text: "#FFFFFF",
  muted: "#8E8E93",
  danger: "#FF453A",
  success: "#30D158",
  warning: "#FF9F0A",
  lightBlue: "#1C2B3A",
  border: "#38383A",
  error: "#FF453A",
  soft: "#1C1C1E",
  dangerSoft: "#3B1E20",
  warningSoft: "#3A2E17",
  successSoft: "#16301D",
};

export const colors: Palette = { ...lightColors };

export const gradients = {
  primary: ["#007AFF", "#5AC8FA", "#64D2FF"] as const,
  sunset: ["#FF9F0A", "#FF375F"] as const,
  success: ["#34C759", "#30B0C7"] as const,
  night: ["#0A2540", "#123E6E", "#1D5AA8"] as const,
};

export const shadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};

function fontFor(weight: unknown) {
  const w = Number(weight === "bold" ? 700 : weight ?? 400);
  if (w >= 800) return fonts.extrabold;
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  if (w >= 500) return fonts.medium;
  return fonts.regular;
}

function withFont<T extends Record<string, any>>(style: T): T {
  if (!style || typeof style !== "object" || style.fontFamily || (style.fontSize == null && style.fontWeight == null)) return style;
  const { fontWeight, ...rest } = style;
  return { ...rest, fontFamily: fontFor(fontWeight), ...(Platform.OS === "web" && fontWeight ? { fontWeight } : {}) } as unknown as T;
}

type StyleInput = Parameters<typeof StyleSheet.create>[0];

export function themedStyles<S extends StyleInput>(factory: () => S & StyleInput): Readonly<S> {
  const cache = new Map<string, Readonly<S>>();
  const current = (): Readonly<S> => {
    const key = colors.background;
    const cached = cache.get(key);
    if (cached) return cached;
    const raw = factory() as Record<string, Record<string, any>>;
    const styles = StyleSheet.create(Object.fromEntries(Object.entries(raw).map(([name, value]) => [name, withFont(value)]))) as unknown as Readonly<S>;
    cache.set(key, styles);
    return styles;
  };
  return new Proxy({} as Readonly<S>, { get: (_target, prop) => current()[prop as keyof S] });
}
