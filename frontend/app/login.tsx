import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "../components/Screen";
import { colors } from "../constants/colors";
import { useSession } from "../hooks/useSession";
import { ApiError } from "../services/api";

export default function LoginScreen() {
  const { ready, user, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!ready) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (user) {
    return <Redirect href="/" />;
  }

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.kicker}>FixMyStreet Pro</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use your citizen, worker, or administrator account.</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} disabled={submitting} onPress={() => void onSubmit()}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>

          <Link href="/register" style={styles.link}>
            Create a citizen account
          </Link>

          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Demo accounts</Text>
            <Text style={styles.demoText}>Citizen: citizen@fixmystreet.local / Citizen123</Text>
            <Text style={styles.demoText}>Worker: worker@fixmystreet.local / Worker123</Text>
            <Text style={styles.demoText}>Administrator: admin@fixmystreet.local / Admin123</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  kicker: { color: colors.accent, fontSize: 13, fontWeight: "700", letterSpacing: 0.6 },
  title: { color: colors.text, fontSize: 34, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 16, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: { color: colors.danger, fontSize: 14 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  link: { color: colors.text, textAlign: "center", marginTop: 8, fontSize: 15 },
  demoCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderColor: colors.border,
    borderWidth: 1,
  },
  demoTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  demoText: { color: colors.text, fontSize: 14 },
});
