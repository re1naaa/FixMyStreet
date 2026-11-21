import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePreferences } from "../hooks/usePreferences";

export function Screen({ children }: { children: ReactNode }) {
  const { colors: themeColors } = usePreferences();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: themeColors.background }]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
