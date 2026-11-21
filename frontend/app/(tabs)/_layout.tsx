import { Redirect, Tabs, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Compass, House, Plus, UserRound, Users } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { useSession } from "../../hooks/useSession";
import { usePreferences } from "../../hooks/usePreferences";

function TabBar({ state }: any) {
  const { t, colors: themeColors } = usePreferences();
  const labels = [t("home"), t("explore"), "", t("community"), t("profile")];
  const icons = [House, Compass, Plus, Users, UserRound];
  const paths = ["/(tabs)", "/(tabs)/explore", "/(tabs)/report", "/(tabs)/community", "/(tabs)/profile"];
  return <View style={[styles.bar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
    {state.routes.map((route: any, index: number) => {
      const active = state.index === index;
      const Icon = icons[index] ?? House;
      if (index === 2) return <Pressable key={route.key} style={styles.reportButton} onPress={() => router.push(paths[index])}><Plus size={27} color="#FFF" strokeWidth={3} /></Pressable>;
      return <Pressable key={route.key} style={styles.tab} onPress={() => router.replace(paths[index])}><Icon size={21} color={active ? colors.accent : colors.muted} strokeWidth={active ? 2.6 : 2} /><Text style={[styles.label, active && styles.labelActive]}>{labels[index]}</Text></Pressable>;
    })}
  </View>;
}

export default function TabsLayout() {
  const { ready, user } = useSession();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  return <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}><Tabs.Screen name="index" /><Tabs.Screen name="explore" /><Tabs.Screen name="report" /><Tabs.Screen name="community" /><Tabs.Screen name="profile" /></Tabs>;
}

const styles = StyleSheet.create({ bar: { height: 78, paddingHorizontal: 8, paddingBottom: 10, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: colors.border, shadowColor: "#101D35", shadowOpacity: 0.08, shadowRadius: 16, elevation: 12 }, tab: { flex: 1, height: 58, alignItems: "center", justifyContent: "center", gap: 3 }, label: { color: colors.muted, fontSize: 10, fontWeight: "700" }, labelActive: { color: colors.accent }, reportButton: { width: 58, height: 58, borderRadius: 29, marginHorizontal: 7, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginTop: -24, borderWidth: 5, borderColor: colors.background, shadowColor: colors.accent, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 } });
