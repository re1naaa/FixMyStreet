import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowUp, MapPin, MessageCircle, Sparkles } from "lucide-react-native";
import { colors, shadow, themedStyles } from "../constants/colors";
import { usePreferences } from "../hooks/usePreferences";
import { absolutePhotoUrl } from "../services/reports";
import type { Report } from "../types/reports";
import { Gradient } from "./Gradient";
import { StatusBadge } from "./StatusBadge";

export const priorityColor = (priority: string | null | undefined) =>
  priority === "critical" ? colors.danger : priority === "high" ? "#FF8A5B" : priority === "medium" ? colors.warning : colors.accentAlt;

export function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const { colors: theme } = usePreferences();
  const photo = absolutePhotoUrl(report.photo_url);
  const date = new Date(report.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const priority = report.priority ?? report.urgency;
  return (
    <Pressable style={({ pressed }) => [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.stripe, { backgroundColor: priorityColor(priority) }]} />
      {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <Gradient colors={[colors.lightBlue, colors.soft]} style={[styles.photo, styles.photoPlaceholder]}><MapPin size={24} color={colors.accent} /></Gradient>}
      <View style={styles.body}>
        <View style={styles.top}><Text numberOfLines={1} style={styles.category}>{report.category_name}</Text><StatusBadge status={report.status} /></View>
        <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>{report.title}</Text>
        {report.fix_count > 0 && <View style={styles.fixTag}><Sparkles size={11} color={colors.success} /><Text style={styles.fixTagText}>Fixed by community</Text></View>}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.date, { color: theme.muted }]}>{report.neighborhood_name ? `${report.neighborhood_name} · ` : ""}{date}</Text>
          <View style={styles.counters}>
            <View style={styles.counter}><MessageCircle size={13} color={theme.muted} /><Text style={[styles.counterText, { color: theme.muted }]}>{report.comment_count}</Text></View>
            <View style={[styles.counter, styles.votePill, report.has_voted && { backgroundColor: colors.accent }]}><ArrowUp size={12} color={report.has_voted ? "#FFF" : colors.accent} strokeWidth={2.8} /><Text style={[styles.counterText, { color: report.has_voted ? "#FFF" : colors.accent }]}>{report.vote_count}</Text></View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = themedStyles(() => ({
  card: { flexDirection: "row", borderRadius: 22, borderWidth: 1, padding: 10, paddingLeft: 14, gap: 12, overflow: "hidden", ...shadow },
  fixTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: colors.successSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  fixTagText: { color: colors.success, fontSize: 10, fontWeight: "800" },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  stripe: { position: "absolute", left: 0, top: 14, bottom: 14, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  photo: { width: 88, height: 88, borderRadius: 16 },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  category: { flexShrink: 1, color: colors.accent, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  date: { flexShrink: 1, fontSize: 11 },
  counters: { flexDirection: "row", alignItems: "center", gap: 8 },
  counter: { flexDirection: "row", alignItems: "center", gap: 3 },
  votePill: { backgroundColor: "rgba(109,93,252,0.10)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  counterText: { fontSize: 11, fontWeight: "800" },
}));
