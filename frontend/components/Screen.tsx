import { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePreferences } from "../hooks/usePreferences";

export const MAX_CONTENT_WIDTH = 640;
export const TAB_BAR_SPACE = 120;

export function Screen({ children }: { children: ReactNode }) {
  const { colors: themeColors, theme } = usePreferences();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: theme === "dark" ? "rgba(139,124,255,0.16)" : "rgba(109,93,252,0.10)" }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottom, { backgroundColor: theme === "dark" ? "rgba(56,210,245,0.10)" : "rgba(34,193,238,0.10)" }]} />
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  inner: { flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  blob: { position: "absolute", width: 320, height: 320, borderRadius: 160, ...(Platform.OS === "web" ? ({ filter: "blur(60px)" } as object) : {}) },
  blobTop: { top: -140, right: -120 },
  blobBottom: { bottom: -160, left: -140 },
});
