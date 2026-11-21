import { Link, Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "../components/Screen";
import { colors } from "../constants/colors";
import { useSession } from "../hooks/useSession";
import { ApiError, listNeighborhoods } from "../services/api";
import type { Neighborhood } from "../types/auth";

export default function RegisterScreen() {
  const { ready, user, signUp } = useSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [neighborhoodId, setNeighborhoodId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    listNeighborhoods()
      .then((items) => {
        if (active) {
          setNeighborhoods(items);
        }
      })
      .catch(() => {
        if (active) {
          setNeighborhoods([]);
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

  if (user) {
    return <Redirect href="/" />;
  }

  async function onSubmit() {
    setError(null);
    if (fullName.trim().length < 2 || !email.trim() || password.length < 8) {
      setError("Enter your name, email, and a password of at least 8 characters with a letter and a number.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email,
        password,
        neighborhood_id: neighborhoodId,
      });
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>FixMyStreet Pro</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>New accounts are citizens. Staff roles are assigned by the municipality.</Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
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

          <Text style={styles.section}>Neighborhood</Text>
          <View style={styles.choices}>
            {neighborhoods.map((item) => {
              const selected = item.id === neighborhoodId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setNeighborhoodId(selected ? null : item.id)}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} disabled={submitting} onPress={() => void onSubmit()}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create account</Text>}
          </Pressable>
          <Link href="/login" style={styles.link}>
            I already have an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 24, gap: 12 },
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
  section: { color: colors.muted, fontSize: 13, marginTop: 4 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  choiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 14 },
  choiceTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  error: { color: colors.danger, fontSize: 14 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  link: { color: colors.text, textAlign: "center", marginTop: 8, fontSize: 15 },
});
