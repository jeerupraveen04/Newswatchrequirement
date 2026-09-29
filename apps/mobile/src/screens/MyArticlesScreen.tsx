import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useDeleteArticle, useMyArticles, useReporterCounts, useSubmitArticle, formatRelative, type ReporterArticle } from "../lib/queries";
import { theme } from "../theme";
import { ScreenshotEmpty } from "../components/ui";
import { StatusBadge } from "./ReporterDashboardScreen";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

const FILTERS = ["all", "draft", "pending", "published", "rejected"] as const;

export function MyArticlesScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "MyArticles">>();
  const [status, setStatus] = useState<string>(route.params?.status ?? "all");
  const { data, isLoading, refetch, isRefetching } = useMyArticles(status === "all" ? undefined : status);
  const { data: counts } = useReporterCounts();
  const submit = useSubmitArticle();
  const remove = useDeleteArticle();

  function open(a: ReporterArticle) {
    if (a.status === "published") navigation.navigate("Article", { slug: a.slug });
    else navigation.navigate("ArticleComposer", { articleId: a.id });
  }

  function actions(a: ReporterArticle) {
    const options: Array<{ text: string; onPress?: () => void; style?: "cancel" | "destructive" }> = [
      { text: "Edit", onPress: () => navigation.navigate("ArticleComposer", { articleId: a.id }) },
    ];
    if (a.status === "published") {
      options.push({ text: "View", onPress: () => navigation.navigate("Article", { slug: a.slug }) });
      options.push({ text: "Share poster", onPress: () => navigation.navigate("SharePoster", { articleId: a.id, title: a.title, summary: a.summary }) });
    }
    if (a.status === "draft" || a.status === "rejected") {
      options.push({ text: "Submit for review", onPress: () => submit.mutate(a.id) });
    }
    if (a.status !== "published") {
      options.push({
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete article?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => remove.mutate(a.id) },
          ]),
      });
    }
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert(a.title, undefined, options);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => {
          const count = f === "all" ? counts?.all : counts?.[f];
          const active = status === f;
          return (
            <Pressable key={f} onPress={() => setStatus(f)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {(f.charAt(0).toUpperCase() + f.slice(1))}
                {count !== undefined ? ` ${count}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={data ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: theme.spacing[4], paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.purple} />}
        ListEmptyComponent={!isLoading ? <ScreenshotEmpty icon="&#128196;" message="No articles in this view." /> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => open(item)} onLongPress={() => actions(item)}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={styles.title}>
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <StatusBadge status={item.status} />
                <Text style={styles.meta}>
                  {"\u25C9"} {item.viewCount} · {formatRelative(item.updatedAt)}
                </Text>
              </View>
              {item.status === "rejected" && item.reviewNote ? (
                <Text style={styles.reject}>Rejection: {item.reviewNote}</Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>{"\u203A"}</Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("ArticleComposer", {})}>
        <Text style={styles.fabText}>+ New</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: theme.spacing[2], paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3] },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing[3],
  },
  title: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  meta: { fontSize: 12, color: theme.colors.muted },
  reject: { color: theme.colors.error, fontSize: 12, marginTop: 6 },
  chevron: { color: theme.colors.muted, fontSize: 22 },
  fab: {
    position: "absolute",
    right: theme.spacing[4],
    bottom: theme.spacing[4],
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 22,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: theme.colors.white, fontWeight: "800", fontSize: 15 },
});
