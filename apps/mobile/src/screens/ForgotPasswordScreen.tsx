import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { FormError, PasswordField, PrimaryButton, TextField } from "../components/form";
import type { RootStackNavigation } from "../navigation/types";

type Step = "request" | "sent" | "reset";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address");
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setStep("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset code");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (code.trim().length !== 6) return setError("Enter the 6-digit code");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setBusy(true);
    setError(null);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword: password });
      setStep("request");
      navigation.navigate("Login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === "request" && (
          <>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>Enter your email and we&rsquo;ll send a 6-digit code.</Text>
            <FormError message={error} />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <PrimaryButton label="Send reset code" onPress={send} busy={busy} />
            <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: theme.spacing[4] }}>
              <Text style={styles.link}>Back to login</Text>
            </Pressable>
          </>
        )}

        {step === "sent" && (
          <>
            <Text style={styles.emoji}>&#9993;</Text>
            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.subtitle}>We sent a code to {email}.</Text>
            <FormError message={error} />
            <TextField label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="000000" />
            <PasswordField label="New password" value={password} onChangeText={setPassword} placeholder="Min 8 characters" />
            <PasswordField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" />
            <PrimaryButton label="Update password" onPress={reset} busy={busy} />
            <Pressable onPress={() => setStep("request")} style={{ marginTop: theme.spacing[4] }}>
              <Text style={styles.link}>Use a different email</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[6], flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6, marginBottom: theme.spacing[5], fontSize: 14 },
  link: { color: theme.colors.purple, fontWeight: "700", textAlign: "center" },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: theme.spacing[3] },
});
