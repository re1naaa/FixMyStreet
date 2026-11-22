import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, themedStyles } from "../constants/colors";
import { usePreferences } from "../hooks/usePreferences";

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  const { colors: theme } = usePreferences();
  return <View style={styles.empty}><View style={[styles.icon, { backgroundColor: theme.lightBlue }]}>{icon}</View><Text style={[styles.title, { color: theme.text }]}>{title}</Text><Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text></View>;
}
const styles = themedStyles(() => ({ empty: { alignItems: "center", paddingVertical: 34, paddingHorizontal: 24 }, icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.lightBlue, alignItems: "center", justifyContent: "center", marginBottom: 14, transform: [{ rotate: "-6deg" }] }, title: { color: colors.text, fontSize: 17, fontWeight: "800", textAlign: "center" }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 } }));
