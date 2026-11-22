import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { CircleCheck, Clock3, Inbox, Moon, ShieldCheck, Sparkles, Sun, Wrench } from "lucide-react-native";

import { AdminReportCard } from "../../components/AdminReportCard";
import { EmptyState } from "../../components/EmptyState";
import { Gradient } from "../../components/Gradient";
import { Screen, TAB_BAR_SPACE } from "../../components/Screen";
import { colors, gradients, shadow, themedStyles } from "../../constants/colors";
import { usePreferences } from "../../hooks/usePreferences";
import { useSession } from "../../hooks/useSession";
import { getAdminOverview, listReports } from "../../services/reports";
import type { AdminOverview, Report } from "../../types/reports";

export default function AdminDashboard() {
  const { token, user } = useSession();
  const { t, theme, setTheme } = usePreferences();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [queue, setQueue] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    Promise.all([getAdminOverview(token), listReports(token)])
      .then(([stats, reports]) => {
        setOverview(stats);
        setQueue(reports.filter((item) => item.status !== "resolved").slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);
  useFocusEffect(load);

  const count = (...keys: Array<keyof AdminOverview["by_status"]>) => keys.reduce((sum, key) => sum + (overview?.by_status[key] ?? 0), 0);
  const tiles = [
    { label: "New", value: count("submitted", "under_review"), icon: Inbox, color: colors.accent, filter: "submitted,under_review" },
    { label: "Approved", value: count("approved", "assigned"), icon: ShieldCheck, color: colors.accentAlt, filter: "approved,assigned" },
    { label: "In progress", value: count("in_progress"), icon: Wrench, color: colors.warning, filter: "in_progress" },
    { label: "Resolved", value: count("resolved"), icon: CircleCheck, color: colors.success, filter: "resolved" },
  ];
  const resolvedShare = overview?.total ? Math.round((count("resolved") / overview.total) * 100) : 0;

  if (!token) return null;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>{t("adminPanel")}</Text>
            <Text style={styles.name}>{user?.full_name ?? "Administrator"}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={20} color={colors.warning} /> : <Moon size={20} color={colors.accent} />}
          </Pressable>
        </View>

        <Gradient colors={gradients.night} style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroKicker}>City control center</Text>
          <Text style={styles.heroValue}>{overview?.total ?? "–"}<Text style={styles.heroUnit}> reports</Text></Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${resolvedShare}%` }]} /></View>
          <View style={styles.heroRow}>
            <Text style={styles.heroText}>{resolvedShare}% resolved</Text>
            <View style={styles.heroPill}><Sparkles size={12} color="#7CF3D2" /><Text style={styles.heroPillText}>{overview?.community_fixes ?? 0} community fixes</Text></View>
          </View>
        </Gradient>

        <View style={styles.grid}>
          {tiles.map(({ label, value, icon: Icon, color, filter }) => (
            <Pressable key={label} style={styles.tile} onPress={() => router.push({ pathname: "/admin/reports", params: { status: filter } })}>
              <View style={[styles.tileIcon, { backgroundColor: `${color}22` }]}><Icon size={18} color={color} /></View>
              <Text style={styles.tileValue}>{value}</Text>
              <Text style={styles.tileLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Clock3 size={16} color={colors.accent} /><Text style={styles.sectionTitle}>Needs attention</Text></View>
          <Pressable onPress={() => router.replace("/admin/reports")}><Text style={styles.link}>See all</Text></Pressable>
        </View>
        {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} /> : queue.length ? (
          <View style={{ gap: 12 }}>
            {queue.map((report) => (
              <AdminReportCard key={report.id} token={token} report={report} onChange={() => load()} onRemove={() => load()} />
            ))}
          </View>
        ) : <EmptyState icon={<CircleCheck size={24} color={colors.success} />} title="All caught up" subtitle="Every report has been resolved." />}
      </ScrollView>
    </Screen>
  );
}

const styles = themedStyles(() => ({
  content: { padding: 18, paddingBottom: TAB_BAR_SPACE, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  name: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 2 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  hero: { borderRadius: 26, padding: 20, overflow: "hidden", gap: 8, ...shadow },
  heroGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, right: -60, top: -80, backgroundColor: "rgba(34,193,238,0.25)" },
  heroKicker: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  heroValue: { color: "#FFFFFF", fontSize: 40, fontWeight: "800" },
  heroUnit: { fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: "#7CF3D2" },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  heroText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  heroPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { flexBasis: "47%", flexGrow: 1, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 },
  tileIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  tileValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
  tileLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  link: { color: colors.accent, fontSize: 13, fontWeight: "700" },
}));
