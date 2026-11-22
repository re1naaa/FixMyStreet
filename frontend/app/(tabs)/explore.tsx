import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { List, Map as MapIcon, Search, SlidersHorizontal } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { ReportCard } from "../../components/ReportCard";
import { EmptyState } from "../../components/EmptyState";
import { colors, shadow, themedStyles } from "../../constants/colors";
import { TAB_BAR_SPACE } from "../../components/Screen";
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
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"map" | "list">("map");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "nearby" | "supported" | "priority">("newest");
  const mapRef = React.useRef<any>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    listCategories(token)
      .then(items => active && setCategories(items))
      .catch(() => {});
    Location.requestForegroundPermissionsAsync()
      .then(result => {
        if (!result.granted) {
          setLocationError("Location permission was denied. Enable location to find nearby reports.");
          setUserLocation(null);
          return;
        }
        void Location.getCurrentPositionAsync({})
          .then(position => {
            if (!active) return;
            const { latitude, longitude } = position.coords;
            if (latitude >= 41.85 && latitude <= 43.0 && longitude >= 19.9 && longitude <= 21.8)
              setUserLocation({ latitude, longitude });
            else
              setLocationError(t("locationUnavailable"));
          })
          .catch(() => setLocationError(t("locationUnavailable")));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [token]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    listReports(token, { category: selectedCategory, priority, status_filter: status, search: query })
      .then(items => {
        if (!active) return;
        setReports(items);
        setLoadError(null);
        setSelected(current => current && items.some(item => item.id === current.id) ? current : null);
      })
      .catch(caught => { if (active) { setReports([]); setLoadError(caught instanceof Error ? caught.message : "Could not load reports."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, selectedCategory, priority, status, query]);

  const distanceKm = (report: Report) => {
    if (!userLocation) return Number.POSITIVE_INFINITY;
    const toRad = (value: number) => value * Math.PI / 180;
    const dLat = toRad(report.latitude - userLocation.latitude);
    const dLon = toRad(report.longitude - userLocation.longitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userLocation.latitude)) * Math.cos(toRad(report.latitude)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  };
  const sortedReports = [...reports].sort((a, b) => {
    if (sort === "supported") return b.vote_count - a.vote_count;
    if (sort === "nearby") return distanceKm(a) - distanceKm(b);
    if (sort === "priority") return ({ critical: 4, high: 3, medium: 2, low: 1 }[b.priority ?? b.urgency] ?? 0) - ({ critical: 4, high: 3, medium: 2, low: 1 }[a.priority ?? a.urgency] ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return <Screen><View style={styles.header}><View><Text style={styles.kicker}>{t("live")}</Text><Text style={styles.title}>{t("exploreYourCity")}</Text></View><View style={styles.modeSwitch}><Pressable style={[styles.modeButton, mode === "map" && styles.modeActive]} onPress={() => setMode("map") }><MapIcon size={17} color={mode === "map" ? "#FFF" : colors.muted} /></Pressable><Pressable style={[styles.modeButton, mode === "list" && styles.modeActive]} onPress={() => setMode("list") }><List size={17} color={mode === "list" ? "#FFF" : colors.muted} /></Pressable></View></View>
    <View style={styles.searchRow}><View style={styles.searchBox}><Search size={17} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder={t("search")} placeholderTextColor={colors.muted} style={styles.searchInput} /></View><Pressable style={[styles.filterButton, (showFilters || priority || status) ? styles.filterButtonActive : null]} onPress={() => setShowFilters(value => !value)}><SlidersHorizontal size={18} color={colors.accent} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filterContent}><Pressable onPress={() => setSelectedCategory("")} style={[styles.chip, !selectedCategory && styles.chipActive]}><Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>{t("all")}</Text></Pressable>{categories.map(item => { const active = selectedCategory === item.slug; return <Pressable key={item.id} onPress={() => setSelectedCategory(active ? "" : item.slug)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text></Pressable>; })}</ScrollView>
    {showFilters ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityFilters} contentContainerStyle={styles.filterContent}><Pressable onPress={() => setPriority("")} style={[styles.priorityChip, !priority && styles.priorityChipActive]}><Text style={styles.priorityText}>{t("anyPriority")}</Text></Pressable>{["critical","high","medium","low"].map(item => <Pressable key={item} onPress={() => setPriority(priority === item ? "" : item)} style={[styles.priorityChip, priority === item && styles.priorityChipActive]}><View style={[styles.priorityDot, { backgroundColor: item === "critical" ? colors.danger : item === "high" ? colors.warning : item === "medium" ? "#F4C542" : colors.accent }]} /><Text style={styles.priorityText}>{t(item as "critical" | "high" | "medium" | "low")}</Text></Pressable>)}</ScrollView> : null}
    {showFilters ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityFilters} contentContainerStyle={styles.filterContent}>{["submitted","under_review","approved","assigned","in_progress","resolved"].map(item => <Pressable key={item} onPress={() => setStatus(status === item ? "" : item)} style={[styles.priorityChip, status === item && styles.priorityChipActive]}><Text style={styles.priorityText}>{item === "submitted" ? t("submitted") : item === "in_progress" ? t("inProgress") : item.replace("_", " ")}</Text></Pressable>)}</ScrollView> : null}
    {loadError ? <View style={styles.locationError}><Text style={styles.locationErrorText}>{loadError}</Text></View> : null}
    {locationError ? <View style={styles.locationError}><Text style={styles.locationErrorText}>{locationError}</Text></View> : null}
    {showFilters ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityFilters} contentContainerStyle={styles.filterContent}>{(["newest","nearby","supported","priority"] as const).map(item => <Pressable key={item} onPress={() => setSort(item)} style={[styles.priorityChip, sort === item && styles.priorityChipActive]}><Text style={styles.priorityText}>{item === "nearby" ? (t("language") === "Gjuha" ? "Së afërmi" : "Nearest") : item === "supported" ? (t("language") === "Gjuha" ? "Më të përkrahuarat" : "Most supported") : item === "priority" ? (t("language") === "Gjuha" ? "Prioriteti" : "Highest priority") : (t("language") === "Gjuha" ? "Më të fundit" : "Newest")}</Text></Pressable>)}</ScrollView> : null}
    {loading && mode === "list" ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View> : mode === "map" ? <View style={styles.mapWrap}><MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={{ latitude: userLocation?.latitude ?? 42.602636, longitude: userLocation?.longitude ?? 20.902977, latitudeDelta: userLocation ? 0.06 : 1.2, longitudeDelta: userLocation ? 0.06 : 1.2 }}>{sortedReports.map(report => <Marker key={report.id} coordinate={{ latitude: report.latitude, longitude: report.longitude }} pinColor={markerColor(report)} badge={report.vote_count} title={`${report.title} · ${report.vote_count} ${t("support")}`} onPress={() => setSelected(report)} />)}{userLocation && <Marker coordinate={userLocation} title="You" dot pinColor={colors.accent} />}</MapView><View style={styles.mapStatus}><Text style={styles.mapStatusText}>{reports.length} {t("activeIssues")}</Text></View><View style={styles.legend}>{([["critical", colors.danger], ["high", colors.warning], ["medium", "#FFCC00"], ["low", colors.accent], ["resolved", colors.success]] as const).map(([key, color]) => <View key={key} style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{key === "resolved" ? t("resolved") : t(key as "critical" | "high" | "medium" | "low")}</Text></View>)}</View>{selected && <Pressable style={styles.previewCard} onPress={() => router.push(`/reports/${selected.id}`)}><View style={{ flex: 1 }}><Text style={styles.previewCategory}>{selected.category_name}</Text><Text numberOfLines={1} style={styles.previewTitle}>{selected.title}</Text><Text style={styles.previewMeta}>{selected.status.replace("_", " ")} • {selected.vote_count} {t("support")}</Text></View><Text style={styles.openText}>{t("explore")}</Text></Pressable>}<Pressable style={styles.locationButton} onPress={() => { if (userLocation) mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 700); else setLocationError(t("locationUnavailable")); }}><Text style={styles.locationButtonText}>◎</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.list}>{sortedReports.length ? sortedReports.map(report => <View key={report.id} style={styles.report}><ReportCard report={report} onPress={() => router.push(`/reports/${report.id}`)} /></View>) : <EmptyState icon={<MapIcon size={24} color={colors.accent} />} title={t("noMatches")} subtitle={t("tryFilters")} />}</ScrollView>}
  </Screen>;
}

const styles = themedStyles(() => ({ header: { height: 76, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, kicker: { color: colors.accent, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 }, title: { color: colors.navy, fontSize: 28, fontWeight: "900", marginTop: 2, letterSpacing: -0.6 }, modeSwitch: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 3 }, modeButton: { width: 36, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" }, modeActive: { backgroundColor: colors.accent }, searchRow: { height: 52, paddingHorizontal: 18, flexDirection: "row", gap: 8 }, searchBox: { flex: 1, height: 48, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 7 }, searchInput: { flex: 1, color: colors.text }, filterButtonActive: { borderColor: colors.accent, backgroundColor: colors.lightBlue }, filterButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, filters: { height: 48, marginTop: 4, flexGrow: 0, flexShrink: 0 }, priorityFilters: { height: 42, flexGrow: 0, flexShrink: 0 }, filterContent: { alignItems: "center", gap: 7, paddingHorizontal: 18 }, chip: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, chipActive: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { color: colors.text, fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#FFF" }, priorityChip: { height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 5 }, priorityChipActive: { borderColor: colors.accent, backgroundColor: colors.lightBlue }, priorityDot: { width: 7, height: 7, borderRadius: 4 }, priorityText: { color: colors.text, fontSize: 10, fontWeight: "800", textTransform: "capitalize" }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, mapWrap: { flex: 1, minHeight: 260, marginHorizontal: 18, marginTop: 8, marginBottom: TAB_BAR_SPACE - 10, borderRadius: 28, overflow: "hidden", backgroundColor: colors.lightBlue, borderWidth: 1, borderColor: colors.border, ...shadow }, map: { flex: 1 }, webMap: { flex: 1, backgroundColor: colors.lightBlue, alignItems: "center", justifyContent: "center" }, webRoadA: { position: "absolute", width: 420, height: 18, backgroundColor: colors.card, transform: [{ rotate: "22deg" }] }, webRoadB: { position: "absolute", width: 360, height: 14, backgroundColor: colors.card, transform: [{ rotate: "-28deg" }] }, webMarker: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: "#FFF" }, webMapText: { color: colors.muted, fontSize: 12, backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }, mapStatus: { position: "absolute", left: 60, top: 12, zIndex: 500, backgroundColor: colors.ink, borderRadius: 17, paddingHorizontal: 13, height: 34, justifyContent: "center" }, mapStatusText: { color: "#FFF", fontSize: 11, fontWeight: "800" }, previewCard: { position: "absolute", left: 12, right: 12, bottom: 12, minHeight: 78, backgroundColor: colors.card, borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", zIndex: 500, ...shadow }, previewCategory: { color: colors.accent, fontSize: 9, fontWeight: "900", textTransform: "uppercase" }, previewTitle: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 3 }, previewMeta: { color: colors.muted, fontSize: 10, marginTop: 5, textTransform: "capitalize" }, openText: { color: colors.accent, fontSize: 12, fontWeight: "900" }, list: { padding: 18, paddingTop: 8, paddingBottom: TAB_BAR_SPACE }, report: { marginBottom: 9 }, locationError: { marginHorizontal: 18, marginTop: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "rgba(255,92,122,0.10)" }, locationErrorText: { color: colors.danger, fontSize: 12, fontWeight: "700", textAlign: "center" }, locationButton: { position: "absolute", right: 12, top: 12, zIndex: 500, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", elevation: 4 }, locationButtonText: { color: "#FFF", fontSize: 24, lineHeight: 24, fontWeight: "600", transform: [{ translateY: Platform.OS === "android" ? 1 : 0 }] }, legend: { position: "absolute", left: 12, top: 12, zIndex: 500, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 8, gap: 5 }, legendRow: { flexDirection: "row", alignItems: "center", gap: 6 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { color: colors.muted, fontSize: 9, fontWeight: "800", textTransform: "capitalize" } }));
