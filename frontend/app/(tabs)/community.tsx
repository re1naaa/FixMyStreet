import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Award, Crown, Leaf, ShieldCheck, Star, Users, TrendingUp, MapPin } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { ReportCard } from "../../components/ReportCard";
import { useSession } from "../../hooks/useSession";
import { usePreferences } from "../../hooks/usePreferences";
import { getAchievements, getCommunity, getNeighborhoodHealth } from "../../services/reports";
import type { Achievement, NeighborhoodHealth, Report } from "../../types/reports";

export default function CommunityScreen() {
  const { token, user } = useSession();
  const { t, colors, language } = usePreferences();
  const [top, setTop] = useState<Report[]>([]);
  const [recent, setRecent] = useState<Report[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: number; name: string; points: number }>>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [health, setHealth] = useState<NeighborhoodHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    try {
      const [community, badges, neighborhood] = await Promise.all([getCommunity(token), getAchievements(token), getNeighborhoodHealth(token)]);
      setTop(community.top_supported);
      setRecent(community.recent);
      setLeaderboard(community.leaderboard);
      setAchievements(badges);
      setHealth(neighborhood);
      setLoadError(null);
    } catch {
      setLoadError(t("tryFilters"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, [token]);
  if (loading) return <Screen><View style={styles.loading}><ActivityIndicator color={colors.accent} /></View></Screen>;

  const icons: Record<string, typeof ShieldCheck> = { neighborhood_hero: ShieldCheck, city_guardian: Crown, first_responder: Star, community_champion: Users, environmental_protector: Leaf };
  const achievementName = (code: string, name: string) => {
    if (language === "sq") {
      const names: Record<string, string> = { first_responder: "Raporti i Parë", neighborhood_hero: "Heroi i Lagjes", city_guardian: "Rojetari i Qytetit", community_champion: "Kampioni i Komunitetit", environmental_protector: "Mbrojtësi i Ambientit" };
      return names[code] ?? name;
    }
    const names: Record<string, string> = { first_responder: "First Report", neighborhood_hero: "Neighborhood Hero", city_guardian: "City Guardian", community_champion: "Community Champion", environmental_protector: "Environmental Protector" };
    return names[code] ?? name;
  };

  return <Screen><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.accent} />} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.kicker}>{t("communityPulse")}</Text><Text style={[styles.title, { color: colors.text }]}>{t("community")}</Text></View><View style={[styles.points, { backgroundColor: colors.lightBlue }]}><Award size={18} color={colors.accent} /><Text style={[styles.pointsText, { color: colors.accent }]}>{user?.points ?? 0} pts</Text></View></View>

    <View style={[styles.hero, { backgroundColor: colors.accent }]}>
      <View style={[styles.heroIcon, { backgroundColor: colors.accent }]}><Users size={25} color="#FFFFFF" /></View>
      <View style={{ flex: 1 }}><Text style={styles.heroTitle}>{t("together")}</Text><Text style={[styles.heroText, { color: "#FFFFFF" }]}>{t("strongerNeighborhoodsText")}</Text></View>
    </View>

    {health && <View style={styles.impactRow}><ImpactValue label={t("resolved")} value={health.resolved_issues} color={colors.success} /><ImpactValue label={t("active")} value={health.open_issues} color={colors.warning} /><ImpactValue label={t("kosovo")} value={`${health.score}%`} color={colors.accent} /></View>}

    <SectionTitle title={t("mostSupported")} icon={<TrendingUp size={17} color={colors.accent} />} />
    {top.length ? top.slice(0, 4).map(report => <View key={report.id} style={styles.report}><ReportCard report={report} onPress={() => router.push(`/reports/${report.id}`)} /></View>) : <Text style={[styles.empty, { color: colors.muted }]}>{t("noCommunityReports")}</Text>}

    <SectionTitle title={t("achievementBadges")} icon={<Award size={17} color={colors.accent} />} />
    <View style={styles.badges}>{achievements.map(item => { const Icon = icons[item.code] ?? Award; return <View key={item.code} style={[styles.badge, { backgroundColor: colors.card, borderColor: item.earned ? colors.success : colors.border }]}><View style={[styles.badgeIcon, { backgroundColor: item.earned ? colors.success : colors.lightBlue }]}><Icon size={20} color={item.earned ? "#FFFFFF" : colors.muted} /></View><Text numberOfLines={2} style={[styles.badgeName, { color: colors.text }]}>{achievementName(item.code, item.name)}</Text><Text style={[styles.badgeStatus, { color: item.earned ? colors.success : colors.muted }]}>{item.earned ? t("earned") : t("inProgressBadge")}</Text></View>; })}</View>

    <SectionTitle title={t("communityLeaderboard")} icon={<Crown size={17} color={colors.accent} />} />
    <View style={[styles.leaderboard, { backgroundColor: colors.card, borderColor: colors.border }]}>{leaderboard.map((item, index) => <View key={item.id} style={[styles.leader, { borderBottomColor: colors.border }]}><View style={[styles.rank, { backgroundColor: index < 3 ? colors.accent : colors.lightBlue }]}><Text style={[styles.rankText, { color: index < 3 ? "#FFFFFF" : colors.muted }]}>{index + 1}</Text></View><View style={[styles.leaderAvatar, { backgroundColor: colors.lightBlue }]}><Text style={[styles.leaderInitial, { color: colors.accent }]}>{item.name.slice(0, 1).toUpperCase()}</Text></View><Text style={[styles.leaderName, { color: colors.text }]}>{item.name}</Text><Text style={[styles.leaderPoints, { color: colors.accent }]}>{item.points} pts</Text></View>)}</View>

    <SectionTitle title={t("recentReports")} icon={<MapPin size={17} color={colors.accent} />} />
    {recent.slice(0, 5).map(report => <View key={report.id} style={styles.report}><ReportCard report={report} onPress={() => router.push(`/reports/${report.id}`)} /></View>)}
  </ScrollView></Screen>;
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) { const { colors } = usePreferences(); return <View style={styles.sectionHeader}><View style={styles.sectionTitleWrap}>{icon}<Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text></View></View>; }
function ImpactValue({ label, value, color }: { label: string; value: number | string; color: string }) { const { colors } = usePreferences(); return <View style={[styles.impactCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.impactValue, { color }]}>{value}</Text><Text style={[styles.impactLabel, { color: colors.muted }]}>{label}</Text></View>; }

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center" }, content: { padding: 18, paddingBottom: 120 }, header: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, kicker: { color: "#397BFF", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }, title: { color: "#101B32", fontSize: 28, fontWeight: "900", marginTop: 2 }, points: { height: 38, borderRadius: 19, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10 }, pointsText: { fontSize: 12, fontWeight: "900" }, hero: { minHeight: 112, borderRadius: 24, padding: 18, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }, heroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }, heroTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }, heroText: { color: "#FFFFFF", fontSize: 12, lineHeight: 18, marginTop: 5 }, impactRow: { flexDirection: "row", gap: 8, marginBottom: 18 }, impactCard: { flex: 1, height: 76, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" }, impactValue: { fontSize: 20, fontWeight: "900" }, impactLabel: { fontSize: 10, marginTop: 3 }, sectionHeader: { marginTop: 8, marginBottom: 10 }, sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 7 }, sectionTitle: { fontSize: 18, fontWeight: "900" }, report: { marginBottom: 9 }, empty: { textAlign: "center", paddingVertical: 24 }, badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }, badge: { width: "31.5%", height: 142, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }, badgeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 }, badgeName: { fontSize: 11, fontWeight: "900", textAlign: "center", height: 28 }, badgeStatus: { fontSize: 9, marginTop: 3 }, leaderboard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, marginBottom: 8 }, leader: { height: 58, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, gap: 8 }, rank: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" }, rankText: { fontSize: 10, fontWeight: "900" }, leaderAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, leaderInitial: { fontWeight: "900" }, leaderName: { flex: 1, fontSize: 12, fontWeight: "800" }, leaderPoints: { fontSize: 11, fontWeight: "900" }, error: { padding: 18, alignItems: "center", justifyContent: "center" }, errorText: { fontSize: 14, textAlign: "center", marginBottom: 10 }, retryButton: { backgroundColor: "#397BFF", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 }, retryButtonText: { color: "#FFFFFF", fontWeight: "700" }, errorTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 }, retry: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", marginTop: 12 } });
