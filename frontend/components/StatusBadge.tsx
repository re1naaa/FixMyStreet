import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

const map: Record<string, { label: string; bg: string; color: string }> = {
  submitted: { label: "Submitted", bg: "#EDF3FF", color: "#3478F6" },
  under_review: { label: "Under review", bg: "#FFF4DF", color: "#B7791F" },
  approved: { label: "Approved", bg: "#EDF3FF", color: "#3478F6" },
  assigned: { label: "Assigned", bg: "#F1EFFF", color: "#6758D8" },
  in_progress: { label: "In progress", bg: "#FFF4DF", color: "#C67A14" },
  resolved: { label: "Resolved", bg: "#E6F8F1", color: "#16855F" },
};

export function StatusBadge({ status }: { status: string }) {
  const item = map[status] ?? map.submitted;
  return <View style={[styles.badge, { backgroundColor: item.bg }]}><Text style={[styles.text, { color: item.color }]}>{item.label}</Text></View>;
}

const styles = StyleSheet.create({ badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, text: { fontSize: 11, fontWeight: "800" } });
