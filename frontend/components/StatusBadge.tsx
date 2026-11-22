import { StyleSheet, Text, View } from "react-native";

const map: Record<string, { label: string; bg: string; color: string }> = {
  submitted: { label: "Submitted", bg: "rgba(109,93,252,0.12)", color: "#6D5DFC" },
  under_review: { label: "Under review", bg: "rgba(255,170,51,0.15)", color: "#C77A0A" },
  approved: { label: "Approved", bg: "rgba(34,193,238,0.14)", color: "#0E8FB5" },
  assigned: { label: "Assigned", bg: "rgba(168,85,247,0.13)", color: "#9333EA" },
  in_progress: { label: "In progress", bg: "rgba(255,138,91,0.15)", color: "#E2622B" },
  resolved: { label: "Resolved", bg: "rgba(18,201,155,0.14)", color: "#0B9E79" },
};

export function StatusBadge({ status }: { status: string }) {
  const item = map[status] ?? map.submitted;
  return <View style={[styles.badge, { backgroundColor: item.bg }]}><View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={[styles.text, { color: item.color }]}>{item.label}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "800" },
});
