import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth, type SessionUser } from "../lib/auth";
import { theme } from "../theme";
import { FormError, PrimaryButton, TextField } from "../components/form";
import type { RootStackNavigation } from "../navigation/types";

export function EditProfileScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const user = useAuth((s) => s.user);
  const updateUser = useAuth((s) => s.updateUser);
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = displayName !== (user?.displayName ?? "") || username !== (user?.username ?? "") || bio !== (user?.bio ?? "");

  async function save() {
    if (displayName.trim().length < 2) return setError("Name must be at least 2 characters");
    if (!/^[a-z0-9_]{3,30}$/.test(username.trim())) {
      return setError("Username: 3-30 lowercase letters, numbers or underscore");
    }
    if (bio.length > 200) return setError("Bio must be 200 characters or fewer");
    setBusy(true);
    setError(null);
    try {
      const updated = await api<SessionUser>("/me", {
        method: "PATCH",
        body: { displayName: displayName.trim(), username: username.trim(), bio: bio.trim() },
      });
      updateUser(updated);
      await qc.invalidateQueries({ queryKey: ["reporter"] });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  function tryBack() {
    if (dirty) {
      Alert.alert("Discard changes?", undefined, [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Edit Profile</Text>
        <FormError message={error} />

        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        <TextField
          label="Username"
          value={username}
          onChangeText={(v) => setUsername(v.toLowerCase())}
          autoCapitalize="none"
          placeholder="username"
        />
        <TextField
          label={`Bio (${bio.length}/200)`}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={200}
          placeholder="Tell readers about you"
          style={{ height: 100, paddingTop: 12 }}
        />

        <View style={styles.readonly}>
          <Text style={styles.roLabel}>Email</Text>
          <Text style={styles.roValue}>{user?.email ?? "—"}</Text>
        </View>
        <View style={styles.readonly}>
          <Text style={styles.roLabel}>Phone</Text>
          <Text style={styles.roValue}>{user?.phone ?? "—"}</Text>
        </View>

        <PrimaryButton label="Save changes" onPress={save} busy={busy} disabled={!dirty} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[5], paddingBottom: 60 },
  heading: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing[4] },
  readonly: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.background,
  },
  roLabel: { fontSize: 12, color: theme.colors.muted, marginBottom: 2 },
  roValue: { fontSize: 15, color: theme.colors.textSecondary },
});
