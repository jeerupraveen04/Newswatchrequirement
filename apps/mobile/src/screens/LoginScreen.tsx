import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { FormError, PasswordField, PrimaryButton, TextField } from "../components/form";
import type { RootStackNavigation } from "../navigation/types";

export function LoginScreen() {
  const login = useAuth((s) => s.login);
  const navigation = useNavigation<RootStackNavigation>();
  const [email, setEmail] = useState("user@newswatch.app");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  async function submit() {
    const localError = validate();
    if (localError) {
      setError(localError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("Tabs", { screen: "Profile" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to save, comment and follow.</Text>

        <FormError message={error} />

        <TextField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <PasswordField
          value={password}
          onChangeText={setPassword}
          textContentType="password"
          placeholder="••••••••"
          onSubmitEditing={submit}
        />

        <Text style={styles.forgot} onPress={() => navigation.navigate("ForgotPassword")}>
          Forgot password?
        </Text>

        <PrimaryButton label="Log in" onPress={submit} busy={busy} disabled={!email || !password} />

        <View style={styles.dividerRow}>
          <View style={styles.hairline} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.hairline} />
        </View>

        <View style={styles.oauthRow}>
          <Pressable style={styles.oauthButton} disabled accessibilityRole="button">
            <Text style={styles.oauthLabel}>Google</Text>
          </Pressable>
          <Pressable style={styles.oauthButton} disabled accessibilityRole="button">
            <Text style={styles.oauthLabel}>Apple</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          New here?{" "}
          <Text style={styles.footerLink} onPress={() => navigation.navigate("Signup")}>
            Create an account
          </Text>
        </Text>
        <Pressable onPress={() => navigation.goBack()} disabled={!navigation.canGoBack()}>
          <Text style={[styles.footer, { color: theme.colors.muted, textAlign: "center", marginTop: theme.spacing[3] }]}>
            Continue as guest
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[6], flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6, marginBottom: theme.spacing[5], fontSize: 14 },
  forgot: { color: theme.colors.purple, fontWeight: "600", fontSize: 13, textAlign: "right", marginBottom: theme.spacing[4] },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: theme.spacing[5] },
  hairline: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.muted, fontSize: 12 },
  oauthRow: { flexDirection: "row", gap: theme.spacing[3] },
  oauthButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    opacity: 0.6,
  },
  oauthLabel: { fontWeight: "600", color: theme.colors.mutedStrong, fontSize: 14 },
  footer: { textAlign: "center", marginTop: theme.spacing[6], color: theme.colors.muted, fontSize: 14 },
  footerLink: { color: theme.colors.purple, fontWeight: "700" },
});
