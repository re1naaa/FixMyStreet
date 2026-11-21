import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "../components/Screen";
import { API_URL } from "../constants/config";
import { colors } from "../constants/colors";
import { useSession } from "../hooks/useSession";
import { getHealth } from "../services/api";

export default function AccountScreen() {
  const { ready, user, signOut } = useSession();
  const [apiState, setApiState] = useState("Checking API…");

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => {
        if (active) {
          setApiState("API connected");
        }
      })
      .catch(() => {
        if (active) {
          setApiState("API unreachable");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.kicker}>FixMyStreet Pro</Text>
        <Text style={styles.title}>Hello, {user.full_name.split(" ")[0]}</Text>
        <Text style={styles.subtitle}>Your account is signed in and stored on this device.</Text>

        <View style={styles.card}>
          <Row label="Email" value={user.email} />
          <Row label="Role" value={user.role} />
          <Row label="Neighborhood" value={user.neighborhood_name ?? "Not set"} />
          <Row label="Points" value={String(user.points)} />
          <Row label="Service" value={apiState} />
          <Text style={styles.api}>{API_URL}</Text>
        </View>

        <Pressable
          style={styles.buttonPrimary}
          onPress={() => router.push(`/${user.role === "administrator" ? "administrator" : user.role === "worker" ? "worker" : "citizen"}`)}
        >
          <Text style={styles.buttonText}>Open {user.role} dashboard</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => void signOut()}>
          <Text style={styles.buttonText}>Log out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  row: {
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    color: colors.text,
    fontSize: 16,
  },
  api: {
    color: colors.muted,
    fontSize: 12,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  button: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
