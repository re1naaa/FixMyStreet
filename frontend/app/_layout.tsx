import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionProvider } from "../hooks/useSession";
import { PreferencesProvider, usePreferences } from "../hooks/usePreferences";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <SessionProvider>
          <RootContent />
        </SessionProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

function RootContent() {
  const { theme, colors: themeColors } = usePreferences();
  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        key={theme}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.background },
          animation: "fade",
        }}
      />
    </>
  );
}
