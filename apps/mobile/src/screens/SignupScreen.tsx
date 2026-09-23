import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { inputStyle, buttonStyle } from "./LoginScreen";

export function SignupScreen() {
  const { register } = useAuth();
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await register({ displayName, email, password });
      (navigation as unknown as { goBack: () => void }).goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ padding: 24, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "800" }}>Sign up</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6, marginBottom: 20 }}>It only takes a minute.</Text>
      {error && <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text>}
      <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Full name" style={inputStyle} />
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={inputStyle} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password (min 8)" style={inputStyle} />
      <Pressable onPress={submit} disabled={busy} style={[buttonStyle, busy && { opacity: 0.6 }]}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>{busy ? "Creating…" : "Create account"}</Text>
      </Pressable>
    </View>
  );
}
