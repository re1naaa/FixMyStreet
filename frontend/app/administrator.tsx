import { Redirect, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "../components/Screen";
import { colors } from "../constants/colors";
import { useSession } from "../hooks/useSession";

export default function AdministratorScreen() {
  const { ready, user } = useSession();

  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== "administrator") return <Redirect href="/" />;

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>Administrator dashboard</Text>
        <Text style={styles.title}>Municipal oversight</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Administrator permissions</Text>
          <Text style={styles.item}>• Review and approve reports</Text>
          <Text style={styles.item}>• Assign reports to workers</Text>
          <Text style={styles.item}>• Manage categories and neighborhoods</Text>
        </View>
        <Pressable style={styles.button} onPress={() => router.replace("/")}>
          <Text style={styles.buttonText}>Back to account</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, gap: 16 },
  kicker: { color: colors.accent, fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 32, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  item: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: "600" },
});
