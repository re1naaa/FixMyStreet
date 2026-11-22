import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronLeft, MapPin } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { ReportCard } from "../../components/ReportCard";
import { EmptyState } from "../../components/EmptyState";
import { colors, themedStyles } from "../../constants/colors";
import { useSession } from "../../hooks/useSession";
import { usePreferences } from "../../hooks/usePreferences";
import { listReports } from "../../services/reports";
import type { Report } from "../../types/reports";

export default function MyReportsScreen() {
  const { token } = useSession();
  const { t } = usePreferences();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!token) return; listReports(token, { mine: true }).then(setReports).catch(() => setReports([])).finally(() => setLoading(false)); }, [token]);
  const filtered = reports.filter(report => filter === "all" || (filter === "pending" && ["submitted","under_review","approved","assigned"].includes(report.status)) || (filter === "progress" && report.status === "in_progress") || (filter === "resolved" && report.status === "resolved"));
  return <Screen><View style={styles.header}><Pressable style={styles.back} onPress={() => router.replace("/(tabs)")}><ChevronLeft size={22} color={colors.text} /></Pressable><Text style={styles.title}>{t("myReports")}</Text><View style={{ width: 40 }} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filterContent}>{[["all","All"],["pending","Pending"],["progress","In progress"],["resolved","Resolved"]].map(([value,label]) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.chip, filter === value && styles.chipActive]}><Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{label}</Text></Pressable>)}</ScrollView>{loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View> : <ScrollView contentContainerStyle={styles.content}>{filtered.length ? filtered.map(report => <View key={report.id} style={styles.report}><ReportCard report={report} onPress={() => router.push(`/reports/${report.id}`)} /></View>) : <EmptyState icon={<MapPin size={24} color={colors.accent} />} title="No reports in this category" subtitle="Your submitted reports will appear here." />}</ScrollView>}</Screen>;
}
const styles = themedStyles(() => ({ header: { height: 70, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, title: { color: colors.navy, fontSize: 18, fontWeight: "900" }, filters: { height: 48, flexGrow: 0, flexShrink: 0 }, filterContent: { gap: 8, paddingHorizontal: 18, alignItems: "center" }, chip: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, chipActive: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { color: colors.text, fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#FFF" }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, content: { padding: 18, gap: 9 }, report: { marginBottom: 9 } }));
