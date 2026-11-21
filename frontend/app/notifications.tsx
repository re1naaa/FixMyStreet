import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bell, ChevronLeft, CircleCheck, MessageCircle, UserCheck } from "lucide-react-native";
import { Screen } from "../components/Screen";
import { EmptyState } from "../components/EmptyState";
import { colors } from "../constants/colors";
import { useSession } from "../hooks/useSession";
import { usePreferences } from "../hooks/usePreferences";
import { getNotifications, readNotification, readNotifications } from "../services/reports";
import type { NotificationItem } from "../types/reports";

export default function NotificationsScreen() {
  const { token } = useSession();
  const { t } = usePreferences();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!token) return; getNotifications(token).then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, [token]);
  async function markAll() { if (!token) return; await readNotifications(token).catch(() => {}); setItems(items.map(item => ({ ...item, read: true }))); }
  async function open(item: NotificationItem) { if (!token) return; if (!item.read) await readNotification(token, item.id).catch(() => {}); setItems(items.map(value => value.id === item.id ? { ...value, read: true } : value)); if (item.report_id) router.push(`/reports/${item.report_id}`); }
  const iconFor = (type: string) => type.includes("resolved") ? CircleCheck : type.includes("comment") ? MessageCircle : type.includes("assign") ? UserCheck : Bell;
  return <Screen><View style={styles.header}><Pressable style={styles.back} onPress={() => router.replace("/(tabs)")}><ChevronLeft size={22} color={colors.text} /></Pressable><Text style={styles.title}>{t("notifications")}</Text><Pressable onPress={() => void markAll()}><Text style={styles.mark}>{t("language") === "Gjuha" ? "Marko të gjitha si lexuar" : "Mark all read"}</Text></Pressable></View>{loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View> : <ScrollView contentContainerStyle={styles.content}>{items.length ? items.map(item => { const Icon = iconFor(item.type); return <Pressable key={item.id} style={[styles.card, !item.read && styles.unread]} onPress={() => void open(item)}><View style={styles.icon}><Icon size={19} color={colors.accent} /></View><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text></View>{!item.read && <View style={styles.dot} />}</Pressable>; }) : <EmptyState icon={<Bell size={24} color={colors.accent} />} title={t("language") === "Gjuha" ? "Të gjitha lexuar" : "You're all caught up"} subtitle={t("language") === "Gjuha" ? "Statuset dhe ndërveprimet do të shfaqen këtu." : "Status updates and community interactions will appear here."} />}</ScrollView>}</Screen>;
}
const styles = StyleSheet.create({ header: { height: 70, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, title: { color: colors.navy, fontSize: 18, fontWeight: "900" }, mark: { color: colors.accent, fontSize: 11, fontWeight: "800" }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, content: { padding: 18, gap: 9 }, card: { minHeight: 84, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }, unread: { borderColor: "#C9DAFF", backgroundColor: "#FAFCFF" }, icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.lightBlue, alignItems: "center", justifyContent: "center" }, itemTitle: { color: colors.text, fontSize: 13, fontWeight: "900" }, body: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, time: { color: "#AAB3C2", fontSize: 9, marginTop: 4 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent } });
