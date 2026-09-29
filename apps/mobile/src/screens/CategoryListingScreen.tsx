import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { useFeed, useCategories, formatRelative, type ArticleCard } from "../lib/queries";
import { theme } from "../theme";
import { ScreenshotEmpty } from "../components/ui";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

export function CategoryListingScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "CategoryListing">>();
  const { name } = route.params;
  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.slug === route.params.slug);
  const { data, refetch, isRefetching, isLoading } = useFeed(category?.id);

  const articles = useMemo(() => data?.items ?? [], [data]);

  return (
    <FlatList<ArticleCard>
      data={articles}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: theme.spacing[4] }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.purple} />}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing[3] }}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.count}>{articles.length} articles</Text>
        </View>
      }
      ListEmptyComponent={!isLoading ? <ScreenshotEmpty icon="&#128240;" message="No articles in this category yet." /> : null}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => navigation.navigate("Article", { slug: item.slug })}>
          {item.heroMedia?.url ? (
            <Image source={{ uri: item.heroMedia.posterUrl ?? item.heroMedia.url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: "#ddd" }]} />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={2} style={styles.rowTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={2} style={styles.summary}>
              {item.summary}
            </Text>
            <Text style={styles.meta}>
              {"\u25C9"} {item.viewCount} · {formatRelative(item.publishedAt)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  count: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing[3],
  },
  thumb: { width: 96, height: 72, borderRadius: theme.radius.md },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text, lineHeight: 20 },
  summary: { fontSize: 12, color: theme.colors.muted, marginTop: 3, lineHeight: 17 },
  meta: { fontSize: 11, color: theme.colors.muted, marginTop: 5 },
});
