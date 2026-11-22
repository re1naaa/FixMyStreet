import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ClipboardList, Search } from "lucide-react-native";

import { AdminReportCard, STATUS_OPTIONS } from "../../components/AdminReportCard";
import { EmptyState } from "../../components/EmptyState";
import { Screen, TAB_BAR_SPACE } from "../../components/Screen";
import { colors, themedStyles } from "../../constants/colors";
import { usePreferences } from "../../hooks/usePreferences";
import { useSession } from "../../hooks/useSession";
import { listReports } from "../../services/reports";
import type { Report } from "../../types/reports";

export default function AdminReports() {
  const { token } = useSession();
  const { t } = usePreferences();
  const params = useLocalSearchParams<{ status?: string }>();
  const [status, setStatus] = useState(params.status ?? "");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setStatus(params.status ?? ""); }, [params.status]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const statuses = status.split(",").filter(Boolean);
  const load = useCallback(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    const wanted = status.split(",").filter(Boolean);
    listReports(token, { status_filter: wanted.length === 1 ? wanted[0] : undefined, search: query || undefined })
      .then((items) => { if (active) setReports(wanted.length > 1 ? items.filter((item) => wanted.includes(item.status)) : items); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, status, query]);
  useFocusEffect(load);

  if (!token) return null;
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("adminPanel")}</Text>
        <Text style={styles.title}>{t("manageReports")}</Text>
      </View>
      <View style={styles.searchBox}>
        <Search size={18} color={colors.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder={t("search")} placeholderTextColor={colors.muted} style={styles.searchInput} />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[["", t("all")] as const, ...STATUS_OPTIONS].map(([value, label]) => (
            <Pressable key={value || "all"} onPress={() => setStatus(value)} style={[styles.filter, status === value && styles.filterActive]}>
              <Text style={[styles.filterText, status === value && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {loading && !reports.length ? <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} /> : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.count}>{reports.length} reports</Text>
          {reports.length ? reports.map((report) => (
            <AdminReportCard
              key={report.id}
              token={token}
              report={report}
              onChange={(updated) => setReports((items) => statuses.length && !statuses.includes(updated.status) ? items.filter((item) => item.id !== updated.id) : items.map((item) => item.id === updated.id ? updated : item))}
              onRemove={(id) => setReports((items) => items.filter((item) => item.id !== id))}
            />
          )) : <EmptyState icon={<ClipboardList size={24} color={colors.accent} />} title={t("noMatches")} subtitle="Try another status or search." />}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = themedStyles(() => ({
  header: { paddingHorizontal: 18, paddingTop: 12 },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 2 },
  searchBox: { height: 48, marginHorizontal: 18, marginTop: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  filters: { gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  filter: { height: 34, borderRadius: 999, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 18, paddingBottom: TAB_BAR_SPACE, gap: 12 },
  count: { color: colors.muted, fontSize: 12, fontWeight: "600" },
}));
