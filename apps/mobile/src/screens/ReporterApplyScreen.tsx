import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useReporterProfile } from "../lib/queries";
import { theme } from "../theme";
import { FormError, PrimaryButton, TextField } from "../components/form";
import type { RootStackNavigation } from "../navigation/types";

export function ReporterApplyScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const { data: profile } = useReporterProfile();
  const setUser = useAuth((s) => s.updateUser);
  const role = useAuth((s) => s.role);

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [beats, setBeats] = useState((profile?.beats ?? []).join(", "));
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (profile?.status === "approved") {
    return (
      <View style={styles.center}>
        <Text style={styles.big}>You&rsquo;re an approved reporter</Text>
        <Text style={styles.muted}>Head to your dashboard to start publishing.</Text>
        <View style={{ height: 20 }} />
        <PrimaryButton label="Go to dashboard" onPress={() => navigation.replace("ReporterDashboard")} />
      </View>
    );
  }

  async function submit() {
    if (fullName.trim().length < 2) return setError("Enter your full name");
    if (bio.trim().length < 10) return setError("Bio must be at least 10 characters");
    if (phone.trim().length < 6) return setError("Enter a valid phone number");
    setBusy(true);
    setError(null);
    try {
      await api("/reporter/apply", {
        method: "POST",
        body: {
          fullName: fullName.trim(),
          bio: bio.trim(),
          phone: phone.trim(),
          beats: beats
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
            .slice(0, 10),
          ...(portfolioUrl.trim() ? { portfolioUrl: portfolioUrl.trim() } : {}),
        },
      });
      setUser({ role: "reporter" });
      navigation.replace("ReporterDashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Application failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Become a reporter</Text>
        <Text style={styles.subtitle}>
          {profile?.status === "pending"
            ? "Your application is under review. You can update your details below."
            : "Tell us about yourself. An admin will review your application."}
        </Text>

        <FormError message={error} />

        <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Your experience and areas of coverage"
          multiline
          numberOfLines={4}
          style={{ height: 100, paddingTop: 12 }}
        />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91…" />
        <TextField label="Beats (comma separated)" value={beats} onChangeText={setBeats} placeholder="politics, business" />
        <TextField
          label="Portfolio URL (optional)"
          value={portfolioUrl}
          onChangeText={setPortfolioUrl}
          autoCapitalize="none"
          placeholder="https://…"
        />

        <PrimaryButton label={profile?.status === "pending" ? "Update application" : "Submit application"} onPress={submit} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[5], paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing[6] },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6, marginBottom: theme.spacing[5], fontSize: 14, lineHeight: 20 },
  big: { fontSize: 20, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
  muted: { color: theme.colors.muted, textAlign: "center", marginTop: 8 },
});
