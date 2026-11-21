import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return <View style={styles.empty}><View style={styles.icon}>{icon}</View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>;
}
const styles = StyleSheet.create({ empty: { alignItems: "center", paddingVertical: 34, paddingHorizontal: 24 }, icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lightBlue, alignItems: "center", justifyContent: "center", marginBottom: 12 }, title: { color: colors.text, fontSize: 17, fontWeight: "800", textAlign: "center" }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 } });
