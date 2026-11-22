import { Platform, StyleSheet } from "react-native";

export const lightColors = {
  background: "#F6F4FF",
  card: "#FFFFFF",
  elevated: "#FFFFFF",
  accent: "#6D5DFC",
  accentAlt: "#22C1EE",
  navy: "#15123B",
  ink: "#15123B",
  text: "#15123B",
  muted: "#76739A",
  danger: "#FF5C7A",
  success: "#12C99B",
  warning: "#FFAA33",
  lightBlue: "#EEEBFF",
  border: "#E7E4FA",
  error: "#FF5C7A",
  soft: "#F8F7FF",
  dangerSoft: "#FFEEF1",
  warningSoft: "#FFF6E6",
  successSoft: "#E6FAF4",
};

export type Palette = typeof lightColors;

export const darkColors: Palette = {
  background: "#0A0918",
  card: "#151330",
  elevated: "#1D1A3F",
  accent: "#9384FF",
  accentAlt: "#3FD5F7",
  navy: "#F3F1FF",
  ink: "#2A2463",
  text: "#F3F1FF",
  muted: "#A19DC9",
  danger: "#FF7590",
  success: "#34DDB0",
  warning: "#FFBE5C",
  lightBlue: "#24204F",
  border: "#2A2654",
  error: "#FF7590",
  soft: "#1A1739",
  dangerSoft: "#3A1828",
  warningSoft: "#3A2A14",
  successSoft: "#123329",
};

export const colors: Palette = { ...lightColors };

export const gradients = {
  primary: ["#7B5CFF", "#5B6CFF", "#22C1EE"] as const,
  sunset: ["#FF6B9A", "#FF8A5B"] as const,
  success: ["#12C99B", "#22C1EE"] as const,
  night: ["#1B1446", "#2A1E6B", "#3B2A8F"] as const,
};

export const shadow = {
  shadowColor: "#4B3BCB",
  shadowOpacity: 0.12,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
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
