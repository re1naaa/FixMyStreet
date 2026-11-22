import { Redirect, Tabs, router } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardList, LayoutDashboard, Map, UserRound } from "lucide-react-native";

import { MAX_CONTENT_WIDTH } from "../../components/Screen";
import { themedStyles } from "../../constants/colors";
import { usePreferences } from "../../hooks/usePreferences";
import { useSession } from "../../hooks/useSession";

const paths = ["/admin", "/admin/reports", "/admin/map", "/admin/profile"] as const;
const icons = [LayoutDashboard, ClipboardList, Map, UserRound];

function AdminTabBar({ state }: any) {
  const { t, theme, colors } = usePreferences();
  const insets = useSafeAreaInsets();
  const labels = [t("dashboard"), t("reports"), t("map"), t("profile")];
  return (
    <View pointerEvents="box-none" style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, { backgroundColor: theme === "dark" ? "rgba(21,19,48,0.94)" : "rgba(255,255,255,0.94)", borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(109,93,252,0.14)" }]}>
        {state.routes.map((route: any, index: number) => {
          const active = state.index === index;
          const Icon = icons[index] ?? LayoutDashboard;
          return (
            <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]} onPress={() => router.replace(paths[index])}>
              <View style={[styles.iconPill, active && { backgroundColor: colors.lightBlue }]}>
                <Icon size={21} color={active ? colors.accent : colors.muted} strokeWidth={active ? 2.5 : 1.9} />
              </View>
              <Text numberOfLines={1} style={[styles.label, { color: active ? colors.accent : colors.muted }]}>{labels[index]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const { ready, user } = useSession();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== "administrator") return <Redirect href="/" />;
  return (
    <Tabs tabBar={(props) => <AdminTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = themedStyles(() => ({
  shell: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12, alignItems: "center" },
  bar: { width: "100%", maxWidth: MAX_CONTENT_WIDTH - 24, height: 70, borderRadius: 26, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 6, shadowColor: "#2A1E6B", shadowOpacity: 0.18, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 18, ...(Platform.OS === "web" ? ({ backdropFilter: "blur(18px)" } as object) : {}) },
  tab: { flex: 1, height: 62, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 18 },
  iconPill: { width: 44, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.1 },
}));
