import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionProvider } from "../hooks/useSession";
import { PreferencesProvider, usePreferences } from "../hooks/usePreferences";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F2F2F7" }}><ActivityIndicator color="#007AFF" /></View>;
  }
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
