import { themedStyles } from "../../constants/colors";
import { Redirect, Tabs, router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Compass, House, Plus, UserRound, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSession } from "../../hooks/useSession";
import { usePreferences } from "../../hooks/usePreferences";
import { Gradient } from "../../components/Gradient";
import { MAX_CONTENT_WIDTH } from "../../components/Screen";

const REPORT_INDEX = 2;

function TabBar({ state }: any) {
  const { t, theme, colors } = usePreferences();
  const insets = useSafeAreaInsets();
  const labels = [t("home"), t("explore"), "", t("community"), t("profile")];
  const icons = [House, Compass, Plus, Users, UserRound];
  const paths = ["/(tabs)", "/(tabs)/explore", "/(tabs)/report", "/(tabs)/community", "/(tabs)/profile"] as const;
  if (state.index === REPORT_INDEX) return null;
  return <View pointerEvents="box-none" style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
    <View style={[styles.bar, { backgroundColor: theme === "dark" ? "rgba(24,21,58,0.92)" : "rgba(255,255,255,0.92)", borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(109,93,252,0.14)" }]}>
      {state.routes.map((route: any, index: number) => {
        const active = state.index === index;
        const Icon = icons[index] ?? House;
        if (index === REPORT_INDEX) return <Pressable key={route.key} accessibilityLabel={t("report")} style={({ pressed }) => [styles.reportButton, { borderColor: colors.background }, pressed && styles.pressed]} onPress={() => { if (Platform.OS !== "web") void Haptics.selectionAsync(); router.push(paths[index]); }}><Gradient style={styles.reportInner}><Plus size={26} color="#FFFFFF" strokeWidth={2.8} /></Gradient></Pressable>;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]} onPress={() => router.replace(paths[index])}>
          <View style={[styles.iconPill, active && { backgroundColor: colors.lightBlue }]}><Icon size={21} color={active ? colors.accent : colors.muted} strokeWidth={active ? 2.5 : 1.9} /></View>
          <Text numberOfLines={1} style={[styles.label, { color: active ? colors.accent : colors.muted }]}>{labels[index]}</Text>
        </Pressable>;
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

const styles = themedStyles(() => ({
  shell: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12, alignItems: "center" },
  bar: { width: "100%", maxWidth: MAX_CONTENT_WIDTH - 24, height: 70, borderRadius: 26, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 6, shadowColor: "#2A1E6B", shadowOpacity: 0.18, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 18, ...(Platform.OS === "web" ? ({ backdropFilter: "blur(18px)" } as object) : {}) },
  tab: { flex: 1, height: 62, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 18 },
  iconPill: { width: 44, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  tabPressed: { opacity: 0.7 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.1 },
  reportButton: { width: 66, height: 66, marginHorizontal: 4, marginTop: -30, borderRadius: 33, alignItems: "center", justifyContent: "center", borderWidth: 5 },
  reportInner: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#6D5DFC", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  pressed: { transform: [{ scale: 0.94 }] },
}));
