import { useState } from "react";
import { Image } from "expo-image";
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { api } from "../lib/api";
import { theme } from "../theme";
import { FormError } from "../components/form";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

const TEMPLATES = ["classic", "breaking", "minimal", "gradient", "photo_hero"] as const;
type Template = (typeof TEMPLATES)[number];

export function SharePosterScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "SharePoster">>();
  const { articleId, title, summary } = route.params;

  const [template, setTemplate] = useState<Template>("classic");
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function render() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ url: string; template: string; width: number; height: number }>("/share/poster", {
        method: "POST",
        body: { articleId, template },
      });
      setPosterUrl(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate poster");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const deepLink = `https://newswatch.app/news/${articleId}`;
    await Share.share({ message: `${title}\n\n${summary ?? ""}\n\n${deepLink}`.trim() });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4] }}>
      <Text style={styles.label}>Template</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TEMPLATES.map((t) => (
          <Pressable key={t} onPress={() => setTemplate(t)} style={[styles.chip, template === t && styles.chipActive]}>
            <Text style={[styles.chipText, template === t && styles.chipTextActive]}>{t.replace("_", " ")}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.stage}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.previewTitle}>{title}</Text>
            {summary ? <Text style={styles.previewSummary}>{summary}</Text> : null}
            <Text style={styles.brand}>newswatch</Text>
          </View>
        )}
      </View>

      <FormError message={error} />

      {posterUrl ? (
        <Pressable style={styles.primary} onPress={() => void Linking.openURL(posterUrl)}>
          <Text style={styles.primaryText}>Open / Download PNG</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.primary} onPress={render} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Generate poster</Text>}
        </Pressable>
      )}

      <Pressable style={styles.secondary} onPress={share}>
        <Text style={styles.secondaryText}>Share article link</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedStrong, marginBottom: 6 },
  chips: { gap: theme.spacing[2], paddingVertical: theme.spacing[1], marginBottom: theme.spacing[4] },
  chip: {
    paddingHorizontal: theme.spacing[4],
    height: 34,
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  chipActive: { backgroundColor: theme.colors.purple, borderColor: theme.colors.purple },
  chipText: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedStrong, textTransform: "capitalize" },
  chipTextActive: { color: theme.colors.white },
  stage: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: theme.colors.purpleLight,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing[4],
  },
  placeholder: { flex: 1, padding: theme.spacing[6], justifyContent: "center" },
  previewTitle: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  previewSummary: { fontSize: 15, color: theme.colors.mutedStrong, marginTop: theme.spacing[3], lineHeight: 22 },
  brand: { position: "absolute", bottom: theme.spacing[5], left: theme.spacing[6], color: theme.colors.purple, fontWeight: "800", fontSize: 18 },
  primary: { backgroundColor: theme.colors.purple, borderRadius: theme.radius.md, height: 48, alignItems: "center", justifyContent: "center" },
  primaryText: { color: theme.colors.white, fontWeight: "700" },
  secondary: {
    marginTop: theme.spacing[3],
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: theme.colors.purple, fontWeight: "700" },
});
