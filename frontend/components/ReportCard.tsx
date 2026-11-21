import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowUp, MapPin } from "lucide-react-native";
import { colors } from "../constants/colors";
import { absolutePhotoUrl } from "../services/reports";
import type { Report } from "../types/reports";
import { StatusBadge } from "./StatusBadge";

export function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const photo = absolutePhotoUrl(report.photo_url);
  const date = new Date(report.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <View style={[styles.photo, styles.photoPlaceholder]}><MapPin size={22} color={colors.accent} /></View>}
      <View style={styles.body}>
        <View style={styles.top}><Text style={styles.category}>{report.category_name}</Text><StatusBadge status={report.status} /></View>
        <Text numberOfLines={2} style={styles.title}>{report.title}</Text>
        <View style={styles.meta}><Text style={styles.date}>{date}</Text><View style={styles.votes}><ArrowUp size={13} color={colors.muted} /><Text style={styles.voteText}>{report.vote_count}</Text></View></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 11, shadowColor: "#101D35", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  photo: { width: 92, height: 92, borderRadius: 13 },
  photoPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.lightBlue },
  body: { flex: 1, justifyContent: "space-between", paddingVertical: 2 }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  category: { color: colors.accent, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }, title: { color: colors.text, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, date: { color: colors.muted, fontSize: 12 }, votes: { flexDirection: "row", alignItems: "center", gap: 3 }, voteText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
