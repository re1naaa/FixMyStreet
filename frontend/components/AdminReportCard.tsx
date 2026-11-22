import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight, MapPin, Sparkles, Trash2 } from "lucide-react-native";

import { colors, shadow, themedStyles } from "../constants/colors";
import { removeReport, updateReportStatus } from "../services/reports";
import type { Report, ReportStatus } from "../types/reports";
import { confirm, errorMessage, notify } from "./confirm";
import { StatusBadge } from "./StatusBadge";

export const STATUS_OPTIONS: Array<[ReportStatus, string]> = [
  ["submitted", "New"],
  ["under_review", "Review"],
  ["approved", "Approved"],
  ["assigned", "Assigned"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
];

export function StatusPicker({ token, report, onChange }: { token: string; report: Report; onChange: (report: Report) => void }) {
  const [saving, setSaving] = useState<ReportStatus | null>(null);
  async function choose(status: ReportStatus) {
    if (status === report.status || saving) return;
    setSaving(status);
    try {
      onChange(await updateReportStatus(token, report.id, status));
    } catch (caught) {
      notify("Could not change status", errorMessage(caught));
    } finally {
      setSaving(null);
    }
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {STATUS_OPTIONS.map(([value, label]) => {
        const active = report.status === value;
        return (
          <Pressable key={value} onPress={() => void choose(value)} style={[styles.chip, active && styles.chipActive]}>
            {saving === value ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function AdminReportCard({ token, report, onChange, onRemove }: { token: string; report: Report; onChange: (report: Report) => void; onRemove: (id: number) => void }) {
  async function remove() {
    if (!(await confirm("Remove report?", `"${report.title}" will be deleted for everyone.`, "Remove"))) return;
    try {
      await removeReport(token, report.id);
      onRemove(report.id);
    } catch (caught) {
      notify("Could not remove report", errorMessage(caught));
    }
  }
  return (
    <View style={styles.card}>
      <Pressable style={styles.top} onPress={() => router.push(`/reports/${report.id}`)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{report.category_name} · {report.reference_code ?? `FMS-${report.id}`}</Text>
          <Text numberOfLines={2} style={styles.title}>{report.title}</Text>
          <View style={styles.meta}>
            <MapPin size={12} color={colors.muted} />
            <Text style={styles.metaText}>{report.neighborhood_name ?? "Kosovo"} · {new Date(report.created_at).toLocaleDateString()} · by {report.author_name}</Text>
          </View>
          {report.fix_count > 0 && <View style={styles.fixTag}><Sparkles size={11} color={colors.success} /><Text style={styles.fixTagText}>Fixed by community</Text></View>}
        </View>
        <View style={{ alignItems: "flex-end", gap: 10 }}>
          <StatusBadge status={report.status} />
          <ChevronRight size={18} color={colors.muted} />
        </View>
      </Pressable>
      <View style={styles.divider} />
      <View style={styles.actions}>
        <View style={{ flex: 1 }}><StatusPicker token={token} report={report} onChange={onChange} /></View>
        <Pressable accessibilityLabel="Remove report" style={styles.remove} onPress={() => void remove()}><Trash2 size={17} color={colors.danger} /></Pressable>
      </View>
    </View>
  );
}

const styles = themedStyles(() => ({
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10, ...shadow },
  top: { flexDirection: "row", gap: 10 },
  category: { color: colors.accent, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 3 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  metaText: { color: colors.muted, fontSize: 11, flexShrink: 1 },
  fixTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: colors.successSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  fixTagText: { color: colors.success, fontSize: 10, fontWeight: "800" },
  divider: { height: 1, backgroundColor: colors.border },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  chips: { gap: 6, paddingRight: 4 },
  chip: { minWidth: 58, height: 32, borderRadius: 999, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  remove: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.dangerSoft },
}));
