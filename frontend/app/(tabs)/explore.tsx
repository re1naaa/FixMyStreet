import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { List, Map as MapIcon, Search, SlidersHorizontal } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { ReportCard } from "../../components/ReportCard";
import { EmptyState } from "../../components/EmptyState";
import { colors } from "../../constants/colors";
import { useSession } from "../../hooks/useSession";
import { usePreferences } from "../../hooks/usePreferences";
import { listCategories, listReports } from "../../services/reports";
import type { Category, Report } from "../../types/reports";
import { MapView, Marker, PROVIDER_GOOGLE } from "../../components/NativeMap";

const markerColor = (report: Report) => {
  if (report.status === "resolved") return colors.success;
  if (report.priority === "critical") return colors.danger;
  if (report.priority === "high") return colors.warning;
  if (report.priority === "medium") return "#F4C542";
  return colors.accent;
};

export default function ExploreScreen() {
  const { token } = useSession();
  const { t } = usePreferences();
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    listCategories(token)
      .then(items => active && setCategories(items))
      .catch(() => {});
    Location.requestForegroundPermissionsAsync()
      .then(result => {
        if (!result.granted) {
          setUserLocation({ latitude: 42.602636, longitude: 20.902977 });
          return;
        }
        void Location.getCurrentPositionAsync({})
          .then(position => {
            if (!active) return;
            const { latitude, longitude } = position.coords;
            if (latitude >= 41.85 && latitude <= 43.0 && longitude >= 19.9 && longitude <= 21.8)
              setUserLocation({ latitude, longitude });
            else
              setUserLocation({ latitude: 42.602636, longitude: 20.902977 });
          })
          .catch(() => setUserLocation({ latitude: 42.602636, longitude: 20.902977 }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [token]);
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listReports(token, { category: selectedCategory, priority, status_filter: status, search })
      .then(items => {
        setReports(items);
        if (!selected || !items.some(item => item.id === selected.id)) setSelected(null);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [token, selectedCategory, priority, status, search]);

  return <Screen><View style={styles.header}><View><Text style={styles.kicker}>{t("live")}</Text><Text style={styles.title}>{t("reports")}</Text></View><View style={styles.modeSwitch}><Pressable style={[styles.modeButton, mode === "map" && styles.modeActive]} onPress={() => setMode("map") }><MapIcon size={17} color={mode === "map" ? "#FFF" : colors.muted} /></Pressable><Pressable style={[styles.modeButton, mode === "list" && styles.modeActive]} onPress={() => setMode("list") }><List size={17} color={mode === "list" ? "#FFF" : colors.muted} /></Pressable></View></View>
    <View style={styles.searchRow}><View style={styles.searchBox}><Search size={17} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder={t("search")} placeholderTextColor={colors.muted} style={styles.searchInput} /></View><Pressable style={styles.filterButton}><SlidersHorizontal size={18} color={colors.accent} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filterContent}><Pressable onPress={() => setSelectedCategory("")} style={[styles.chip, !selectedCategory && styles.chipActive]}><Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>{t("all")}</Text></Pressable>{categories.map(item => { const active = selectedCategory === item.slug; return <Pressable key={item.id} onPress={() => setSelectedCategory(active ? "" : item.slug)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text></Pressable>; })}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityFilters} contentContainerStyle={styles.filterContent}><Pressable onPress={() => setPriority("")} style={[styles.priorityChip, !priority && styles.priorityChipActive]}><Text style={styles.priorityText}>Any priority</Text></Pressable>{["critical","high","medium","low"].map(item => <Pressable key={item} onPress={() => setPriority(priority === item ? "" : item)} style={[styles.priorityChip, priority === item && styles.priorityChipActive]}><View style={[styles.priorityDot, { backgroundColor: item === "critical" ? colors.danger : item === "high" ? colors.warning : item === "medium" ? "#F4C542" : colors.accent }]} /><Text style={styles.priorityText}>{item}</Text></Pressable>)}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityFilters} contentContainerStyle={styles.filterContent}>{["submitted","under_review","approved","assigned","in_progress","resolved"].map(item => <Pressable key={item} onPress={() => setStatus(status === item ? "" : item)} style={[styles.priorityChip, status === item && styles.priorityChipActive]}><Text style={styles.priorityText}>{item.replace("_", " ")}</Text></Pressable>)}</ScrollView>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View> : mode === "map" ? <View style={styles.mapWrap}><MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={{ latitude: userLocation?.latitude ?? 42.602636, longitude: userLocation?.longitude ?? 20.902977, latitudeDelta: 0.06, longitudeDelta: 0.06 }}>{reports.map(report => <Marker key={report.id} coordinate={{ latitude: report.latitude, longitude: report.longitude }} pinColor={markerColor(report)} onPress={() => setSelected(report)} />)}{userLocation && <Marker coordinate={userLocation} title="You" pinColor={colors.accent} />}</MapView><View style={styles.mapStatus}><Text style={styles.mapStatusText}>{reports.length} {t("activeIssues")}</Text></View>{selected && <Pressable style={styles.previewCard} onPress={() => router.push(`/reports/${selected.id}`)}><View style={{ flex: 1 }}><Text style={styles.previewCategory}>{selected.category_name}</Text><Text numberOfLines={1} style={styles.previewTitle}>{selected.title}</Text><Text style={styles.previewMeta}>{selected.status.replace("_", " ")} • {selected.vote_count} {t("support")}</Text></View><Text style={styles.openText}>{t("explore")}</Text></Pressable>}</View> : <ScrollView contentContainerStyle={styles.list}>{reports.length ? reports.map(report => <View key={report.id} style={styles.report}><ReportCard report={report} onPress={() => router.push(`/reports/${report.id}`)} /></View>) : <EmptyState icon={<MapIcon size={24} color={colors.accent} />} title={t("noMatches")} subtitle={t("tryFilters")} />}</ScrollView>}
  </Screen>;
}

const styles = StyleSheet.create({ header: { height: 76, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, kicker: { color: colors.accent, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 }, title: { color: colors.navy, fontSize: 24, fontWeight: "900", marginTop: 2 }, modeSwitch: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 3 }, modeButton: { width: 36, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" }, modeActive: { backgroundColor: colors.accent }, searchRow: { height: 52, paddingHorizontal: 18, flexDirection: "row", gap: 8 }, searchBox: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 7 }, searchInput: { flex: 1, color: colors.text }, filterButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, filters: { height: 48, marginTop: 4 }, priorityFilters: { height: 42 }, filterContent: { alignItems: "center", gap: 7, paddingHorizontal: 18 }, chip: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, chipActive: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { color: colors.text, fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#FFF" }, priorityChip: { height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFF", paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 5 }, priorityChipActive: { borderColor: colors.accent }, priorityDot: { width: 7, height: 7, borderRadius: 4 }, priorityText: { color: colors.text, fontSize: 10, fontWeight: "800", textTransform: "capitalize" }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, mapWrap: { flex: 1, margin: 18, marginTop: 8, borderRadius: 22, overflow: "hidden", backgroundColor: "#E7EEF8" }, map: { flex: 1 }, webMap: { flex: 1, backgroundColor: "#E7EEF8", alignItems: "center", justifyContent: "center" }, webRoadA: { position: "absolute", width: 420, height: 18, backgroundColor: "#FFF", transform: [{ rotate: "22deg" }] }, webRoadB: { position: "absolute", width: 360, height: 14, backgroundColor: "#FFF", transform: [{ rotate: "-28deg" }] }, webMarker: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: "#FFF" }, webMapText: { color: colors.muted, fontSize: 12, backgroundColor: "#FFF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }, mapStatus: { position: "absolute", left: 12, top: 12, backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 11, height: 34, justifyContent: "center" }, mapStatusText: { color: colors.text, fontSize: 11, fontWeight: "800" }, previewCard: { position: "absolute", left: 12, right: 12, bottom: 12, minHeight: 78, backgroundColor: "#FFF", borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", shadowColor: "#101D35", shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 }, previewCategory: { color: colors.accent, fontSize: 9, fontWeight: "900", textTransform: "uppercase" }, previewTitle: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 3 }, previewMeta: { color: colors.muted, fontSize: 10, marginTop: 5, textTransform: "capitalize" }, openText: { color: colors.accent, fontSize: 12, fontWeight: "900" }, list: { padding: 18, paddingTop: 8 }, report: { marginBottom: 9 } });
