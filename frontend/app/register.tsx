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
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, MapPin, User } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { colors, themedStyles } from "../constants/colors";
import { useSession } from "../hooks/useSession";
import { usePreferences } from "../hooks/usePreferences";
import { ApiError, listNeighborhoods } from "../services/api";
import { saveRememberedEmail } from "../services/tokenStore";
import type { Neighborhood } from "../types/auth";

export default function RegisterScreen() {
  const { ready, user, signUp } = useSession();
  const { language, setLanguage, t } = usePreferences();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
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
    return <Redirect href="/(tabs)" />;
  }

  async function submit() {
    setError(null);
    if (fullName.trim().length < 2 || !email.trim()) {
      setError("Enter your full name and email.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be 8 characters with a letter and number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("Accept the terms to continue.");
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
      await saveRememberedEmail(email);
      router.replace("/(tabs)");
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
          <Pressable style={styles.back} onPress={() => router.replace("/login")}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{t("register")}</Text>
          <Text style={styles.subtitle}>{language === "sq" ? "Krijo një llogari për ta bërë lagjen më të mirë." : "Create an account to make your neighborhood better."}</Text>

          <View style={styles.field}>
            <User size={19} color={colors.muted} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("fullName")}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Mail size={19} color={colors.muted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("email")}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <LockKeyhole size={19} color={colors.muted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("password")}
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
            </Pressable>
          </View>
          <View style={styles.field}>
            <LockKeyhole size={19} color={colors.muted} />
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder={t("confirmPassword")}
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
          </View>

          <Text style={styles.section}>{t("neighborhood")}</Text>
          <View style={styles.choices}>
            {neighborhoods.map((item) => {
              const selected = item.id === neighborhoodId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setNeighborhoodId(selected ? null : item.id)}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <MapPin size={14} color={selected ? "#FFF" : colors.accent} />
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.terms} onPress={() => setAccepted(!accepted)}>
            <View style={[styles.check, accepted && styles.checkActive]}>{accepted && <Text style={styles.checkMark}>✓</Text>}</View>
            <Text style={styles.termsText}>{t("terms")}</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} disabled={submitting} onPress={() => void submit()}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t("register")}</Text>}
          </Pressable>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("existingAccount")} </Text>
            <Link href="/login" style={styles.link}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = themedStyles(() => ({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingTop: 12 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.navy, fontSize: 32, fontWeight: "900", marginTop: 24 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 7, marginBottom: 22 },
  field: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  section: { color: colors.text, fontWeight: "800", marginTop: 4, marginBottom: 9 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    height: 38,
    backgroundColor: colors.card,
  },
  choiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  choiceTextSelected: { color: "#FFF" },
  terms: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 16 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  termsText: { flex: 1, color: colors.muted, fontSize: 12 },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 10, marginTop: 12, fontSize: 13 },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: "800" },
}));
