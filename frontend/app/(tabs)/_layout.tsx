import { Redirect, Tabs, router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Compass, House, Plus, UserRound, Users } from "lucide-react-native";
import { useSession } from "../../hooks/useSession";
import { usePreferences } from "../../hooks/usePreferences";
import * as Haptics from "expo-haptics";

function TabBar({ state }: any) {
  const { t, theme, colors } = usePreferences();
  const labels = [t("home"), t("explore"), "", t("community"), t("profile")];
  const icons = [House, Compass, Plus, Users, UserRound];
  const paths = ["/(tabs)", "/(tabs)/explore", "/(tabs)/report", "/(tabs)/community", "/(tabs)/profile"];
  return <View style={styles.shell}>
    <View style={[styles.bar, { backgroundColor: theme === "dark" ? "rgba(28,28,30,0.96)" : "rgba(255,255,255,0.94)", borderColor: theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(60,60,67,0.12)" }]}>
      {state.routes.map((route: any, index: number) => {
        const active = state.index === index;
        const Icon = icons[index] ?? House;
        if (index === 2) return <Pressable key={route.key} accessibilityLabel={t("report")} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]} onPress={() => { void Haptics.selectionAsync(); router.push(paths[index]); }}><View style={styles.reportInner}><Plus size={25} color="#FFFFFF" strokeWidth={2.8} /></View></Pressable>;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]} onPress={() => router.replace(paths[index])}><Icon size={22} color={active ? colors.accent : colors.muted} strokeWidth={active ? 2.6 : 1.8} /><Text numberOfLines={1} style={[styles.label, { color: active ? colors.accent : colors.muted }]}>{labels[index]}</Text></Pressable>;
      })}
    </View>
  </View>;
}

export default function TabsLayout() {
  const { ready, user } = useSession();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  return <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}><Tabs.Screen name="index" /><Tabs.Screen name="explore" /><Tabs.Screen name="report" /><Tabs.Screen name="community" /><Tabs.Screen name="profile" /></Tabs>;
}

const styles = StyleSheet.create({
  shell: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingBottom: Platform.OS === "ios" ? 8 : 6 },
  bar: { height: 68, borderRadius: 22, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 7, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 18 },
  tab: { flex: 1, height: 58, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 16 },
  tabPressed: { opacity: 0.72 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: -0.1 },
  reportButton: { width: 62, height: 62, marginHorizontal: 5, marginTop: -24, borderRadius: 31, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(242,242,247,0.92)" },
  reportInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#3478F6", alignItems: "center", justifyContent: "center", shadowColor: "#3478F6", shadowOpacity: 0.38, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
  pressed: { transform: [{ scale: 0.94 }] },
});
