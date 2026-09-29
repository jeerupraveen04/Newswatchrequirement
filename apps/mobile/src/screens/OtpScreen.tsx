import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { FormError, PrimaryButton } from "../components/form";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

const LENGTH = 6;

export function OtpScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "Otp">>();
  const { identifier, channel, purpose = "login" } = route.params;
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const requestOtp = useAuth((s) => s.requestOtp);

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join("");

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    setDigits((prev) => {
      const next = [...prev];
      if (clean.length > 1) {
        clean.split("").forEach((ch, k) => {
          if (i + k < LENGTH) next[i + k] = ch;
        });
      } else {
        next[i] = clean;
      }
      return next;
    });
    if (clean && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  async function submit() {
    if (code.length !== LENGTH) return setError("Enter the 6-digit code");
    setBusy(true);
    setError(null);
    try {
      const user = await verifyOtp({ identifier, code, purpose });
      if (purpose === "reset") {
        navigation.replace("ForgotPassword");
      } else if (user) {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate("Tabs", { screen: "Profile" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    try {
      await requestOtp({ identifier, channel, purpose });
      setCooldown(30);
      setDigits(Array(LENGTH).fill(""));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify your {channel === "sms" ? "phone" : "email"}</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {mask(identifier)}.</Text>

        <FormError message={error} />

        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
              }}
              keyboardType="number-pad"
              maxLength={LENGTH}
              style={[styles.box, !!error && styles.boxError]}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />
          ))}
        </View>

        <PrimaryButton label="Verify" onPress={submit} busy={busy} disabled={code.length !== LENGTH} />

        <Pressable onPress={resend} disabled={cooldown > 0} style={{ marginTop: theme.spacing[4] }}>
          <Text style={[styles.resend, cooldown > 0 && { color: theme.colors.muted }]}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function mask(identifier: string): string {
  if (identifier.includes("@")) {
    const [name = "", domain = ""] = identifier.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return identifier.length > 4 ? `${identifier.slice(0, 2)}****${identifier.slice(-2)}` : identifier;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing[6], justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6, marginBottom: theme.spacing[5], fontSize: 14 },
  boxes: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing[2], marginBottom: theme.spacing[5] },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  boxError: { borderColor: theme.colors.error },
  resend: { color: theme.colors.purple, fontWeight: "700", textAlign: "center" },
});
