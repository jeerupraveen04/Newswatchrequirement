import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";

export function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState("user@newswatch.app");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      (navigation as unknown as { goBack: () => void }).goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ padding: 24, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "800" }}>Log in</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6, marginBottom: 20 }}>Use your email to continue.</Text>
      {error && <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text>}
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        style={inputStyle}
      />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" style={inputStyle} />
      <Pressable onPress={submit} disabled={busy} style={[buttonStyle, busy && { opacity: 0.6 }]}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>{busy ? "Logging in…" : "Log in"}</Text>
      </Pressable>
      <Link to="/Signup" style={{ color: theme.colors.purple, textAlign: "center", marginTop: 16, fontWeight: "600" }}>
        Create an account
      </Link>
    </View>
  );
}

export const inputStyle = {
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
  padding: 14,
  fontSize: 15,
  marginBottom: 12,
  backgroundColor: "#fff",
  color: theme.colors.text,
};
export const buttonStyle = {
  backgroundColor: theme.colors.purple,
  borderRadius: theme.radius.md,
  padding: 14,
  alignItems: "center" as const,
};
