import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { FormError, PasswordField, PrimaryButton, TextField } from "../components/form";
import type { RootStackNavigation } from "../navigation/types";

export function SignupScreen() {
  const register = useAuth((s) => s.register);
  const navigation = useNavigation<RootStackNavigation>();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (displayName.trim().length < 2) return "Enter your name";
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
      await register({ displayName: displayName.trim(), email: email.trim(), password });
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("Tabs", { screen: "Profile" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = displayName.length > 0 && email.length > 0 && password.length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join NewsWatch in a few seconds.</Text>

        <FormError message={error} />

        <TextField label="Full name" value={displayName} onChangeText={setDisplayName} autoComplete="name" placeholder="Aarav Sharma" />
        <TextField
          label="Email"
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
          textContentType="newPassword"
          placeholder="Min 8 characters"
          onSubmitEditing={submit}
        />

        <PrimaryButton label="Create account" onPress={submit} busy={busy} disabled={!canSubmit} />

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footerLink}>Log in</Text>
          </Pressable>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[6], flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6, marginBottom: theme.spacing[5], fontSize: 14 },
  footer: { textAlign: "center", marginTop: theme.spacing[6], color: theme.colors.muted, fontSize: 14 },
  footerLink: { color: theme.colors.purple, fontWeight: "700" },
});
