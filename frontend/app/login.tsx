import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
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
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { colors, themedStyles } from "../constants/colors";
import { useSession } from "../hooks/useSession";
import { usePreferences } from "../hooks/usePreferences";
import { ApiError } from "../services/api";

export default function LoginScreen() {
  const { ready, user, signIn } = useSession();
  const { setLanguage, t } = usePreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
    return <Redirect href="/(tabs)" />;
  }

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password, remember);
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.back} onPress={() => router.replace("/welcome")}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>

          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={styles.brandName}>
              FixMyStreet{" "}
              <Text style={styles.brandPro}>PRO</Text>
            </Text>
          </View>
          <Text style={styles.title}>{t("welcomeBack")}</Text>
          <Text style={styles.subtitle}>
            {t("loginSubtitle")}
          </Text>

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
              {showPassword ? (
                <EyeOff size={20} color={colors.muted} />
              ) : (
                <Eye size={20} color={colors.muted} />
              )}
            </Pressable>
          </View>
          <View style={styles.options}>
            <Pressable
              style={styles.remember}
              onPress={() => setRemember(!remember)}
            >
              <View
                style={[
                  styles.check,
                  remember && styles.checkActive,
                ]}
              >
                {remember && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.optionText}>{t("rememberMe")}</Text>
            </Pressable>
            <Text style={styles.forgot}>{t("forgotPassword")}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={styles.button}
            disabled={submitting}
            onPress={() => void submit()}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{t("signIn")}</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("newAccount")} </Text>
            <Link href="/register" style={styles.link}>
              {t("register")}
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
  content: { flexGrow: 1, padding: 24, paddingTop: 12 },
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
  brand: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 28,
    marginBottom: 38,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  brandName: { color: colors.navy, fontSize: 18, fontWeight: "900" },
  brandPro: { color: colors.accent, fontSize: 12 },
  title: { color: colors.navy, fontSize: 34, fontWeight: "900" },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 28,
  },
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
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  remember: { flexDirection: "row", alignItems: "center", gap: 8 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  optionText: { color: colors.text, fontSize: 13 },
  forgot: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    fontSize: 13,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: "800" },
}));
