import { themedStyles } from "../constants/colors";
import { ReactNode, useEffect, useRef } from "react";
import { Animated, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePreferences } from "../hooks/usePreferences";

export const MAX_CONTENT_WIDTH = 640;
export const TAB_BAR_SPACE = 120;

export function Screen({ children }: { children: ReactNode }) {
  const { colors: themeColors, theme } = usePreferences();
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== "web" }).start();
  }, [enter]);
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: theme === "dark" ? "rgba(147,132,255,0.22)" : "rgba(109,93,252,0.10)" }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottom, { backgroundColor: theme === "dark" ? "rgba(63,213,247,0.14)" : "rgba(34,193,238,0.10)" }]} />
      <Animated.View style={[styles.inner, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, overflow: "hidden" },
  inner: { flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  blob: { position: "absolute", width: 320, height: 320, borderRadius: 160, ...(Platform.OS === "web" ? ({ filter: "blur(60px)" } as object) : {}) },
  blobTop: { top: -140, right: -120 },
  blobBottom: { bottom: -160, left: -140 },
}));
