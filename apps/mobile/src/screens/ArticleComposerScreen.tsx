import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useCategories, useReporterArticle, useReporterRegions, stripHtml, wordCount } from "../lib/queries";
import { theme } from "../theme";
import { FormError, PrimaryButton, TextField } from "../components/form";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

export function ArticleComposerScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "ArticleComposer">>();
  const articleId = route.params?.articleId;
  const editing = Boolean(articleId);
  const qc = useQueryClient();

  const { data: regions } = useReporterRegions();
  const { data: categories } = useCategories();
  const { data: existing } = useReporterArticle(articleId ?? "");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [regionId, setRegionId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setSummary(existing.summary);
      setBody(stripHtml(existing.body));
      setCategoryIds(existing.categories.map((c) => c.id));
      setTags(existing.tags.join(", "));
      setRegionId((existing as unknown as { region?: { id: string } }).region?.id ?? null);
    }
  }, [existing]);

  useEffect(() => {
    const first = regions?.[0];
    if (!regionId && first) setRegionId(first.id);
  }, [regions, regionId]);

  const words = useMemo(() => wordCount(body), [body]);
  const canSubmit = title.trim().length >= 5 && summary.trim().length > 0 && words >= 200 && regionId && categoryIds.length > 0;

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function save(submitForReview: boolean) {
    if (title.trim().length < 5) return setError("Title must be at least 5 characters");
    if (!summary.trim()) return setError("Summary is required");
    if (!regionId) return setError("Select a region");
    if (submitForReview) {
      if (words < 200) return setError(`Body must be at least 200 words (currently ${words})`);
      if (categoryIds.length === 0) return setError("Select at least one category");
    }
    setBusy(true);
    setError(null);
    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      body: stripHtml(body),
      bodyFormat: "rich" as const,
      regionId,
      categoryIds,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
    };
    try {
      let id = articleId;
      if (editing && id) {
        await api(`/reporter/articles/${id}`, { method: "PATCH", body: payload });
      } else {
        const created = await api<{ id: string }>("/reporter/articles", { method: "POST", body: payload });
        id = created.id;
      }
      if (submitForReview && id) {
        await api(`/reporter/articles/${id}/submit`, { method: "POST" });
      }
      await qc.invalidateQueries({ queryKey: ["reporter"] });
      Alert.alert(submitForReview ? "Submitted" : "Saved", submitForReview ? "Sent for review." : "Draft saved.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function tryBack() {
    if (title || summary || body) {
      Alert.alert("Discard changes?", "Unsaved changes will be lost.", [
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
        <Text style={styles.heading}>{editing ? "Edit Article" : "New Article"}</Text>
        {existing?.status === "rejected" && (existing as unknown as { reviewNote?: string }).reviewNote ? (
          <View style={styles.rejectBanner}>
            <Text style={styles.rejectTitle}>Changes requested</Text>
            <Text style={styles.rejectText}>{(existing as unknown as { reviewNote?: string }).reviewNote}</Text>
          </View>
        ) : null}

        <FormError message={error} />

        <TextField
          label={`Title (${title.length}/140)`}
          value={title}
          onChangeText={setTitle}
          placeholder="Headline"
          maxLength={140}
        />
        <TextField
          label={`Summary (${summary.length}/300)`}
          value={summary}
          onChangeText={setSummary}
          placeholder="One-sentence summary"
          multiline
          numberOfLines={3}
          maxLength={300}
          style={{ height: 80, paddingTop: 12 }}
        />
        <TextField
          label={`Body (${words} words, min 200)`}
          value={body}
          onChangeText={setBody}
          placeholder="Write your story…"
          multiline
          style={{ height: 220, paddingTop: 12, textAlignVertical: "top" }}
        />

        <Text style={styles.label}>Region</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(regions ?? []).map((r) => (
            <Pressable key={r.id} onPress={() => setRegionId(r.id)} style={[styles.chip, regionId === r.id && styles.chipActive]}>
              <Text style={[styles.chipText, regionId === r.id && styles.chipTextActive]}>
                {r.name} · {r.type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Categories</Text>
        <View style={styles.wrapRow}>
          {(categories ?? []).map((c) => (
            <Pressable key={c.id} onPress={() => toggleCategory(c.id)} style={[styles.chip, categoryIds.includes(c.id) && styles.chipActive]}>
              <Text style={[styles.chipText, categoryIds.includes(c.id) && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Tags (comma separated, max 10)"
          value={tags}
          onChangeText={setTags}
          placeholder="politics, monsoon"
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable style={[styles.secondary, busy && { opacity: 0.5 }]} disabled={busy} onPress={() => save(false)}>
          <Text style={styles.secondaryText}>Save draft</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, (!canSubmit || busy) && { opacity: 0.5 }]}
          disabled={!canSubmit || busy}
          onPress={() => save(true)}
        >
          <Text style={styles.primaryText}>{busy ? "Working…" : "Submit for review"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[4], paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing[4] },
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedStrong, marginBottom: 6, marginTop: theme.spacing[2] },
  chips: { gap: theme.spacing[2], paddingVertical: theme.spacing[1] },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2], marginBottom: theme.spacing[3] },
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
  chipText: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedStrong },
  chipTextActive: { color: theme.colors.white },
  rejectBanner: { backgroundColor: "rgba(220,38,38,0.08)", borderRadius: theme.radius.md, padding: 12, marginBottom: theme.spacing[3] },
  rejectTitle: { color: theme.colors.error, fontWeight: "800", marginBottom: 4 },
  rejectText: { color: theme.colors.error, fontSize: 13 },
  actionBar: {
    flexDirection: "row",
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  secondary: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: theme.colors.purple, fontWeight: "700" },
  primary: { flex: 1.4, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.purple, alignItems: "center", justifyContent: "center" },
  primaryText: { color: theme.colors.white, fontWeight: "800" },
});
