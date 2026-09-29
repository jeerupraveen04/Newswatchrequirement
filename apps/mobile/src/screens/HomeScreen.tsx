import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCategories, useFeed, type ArticleCard } from "../lib/queries";
import { ArticleRow, ArticleTile } from "../components/article-card";
import { ScreenshotEmpty, SkeletonRow } from "../components/ui";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

export function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: categories } = useCategories();
  const { data, isLoading, refetch, isRefetching } = useFeed(activeCategory ?? undefined);
  const navigation = useNavigation<RootStackNavigation>();

  function open(slug: string) {
    navigation.navigate("Article", { slug });
  }

  const articles = data?.items ?? [];

  return (
    <FlatList<ArticleCard>
      data={articles}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: theme.spacing[4], paddingTop: 0 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.purple} />}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.logo} />
            <Text style={styles.wordmark}>newswatch</Text>
            <View style={{ flex: 1 }} />
            <Pressable hitSlop={10} onPress={() => navigation.navigate("Tabs", { screen: "Search" })}>
              <Text style={styles.headerIcon}>{"\u2315"}</Text>
            </Pressable>
            <Pressable hitSlop={10} onPress={() => navigation.navigate("Notifications")}>
              <Text style={styles.headerIcon}>{"\u2691"}</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <CategoryChip label="For You" active={activeCategory === null} onPress={() => setActiveCategory(null)} />
            {(categories ?? []).map((c) => (
              <CategoryChip key={c.id} label={c.name} active={activeCategory === c.id} onPress={() => setActiveCategory(c.id)} />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Today&rsquo;s headlines</Text>
        </View>
      }
      ListEmptyComponent={isLoading ? <SkeletonRow /> : <ScreenshotEmpty icon="&#128240;" message="No published stories yet." />}
      renderItem={({ item, index }) =>
        index === 0 ? (
          <ArticleTile article={item} onPress={() => open(item.slug)} />
        ) : (
          <ArticleRow article={item} onPress={() => open(item.slug)} />
        )
      }
    />
  );
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    backgroundColor: theme.colors.purple,
    marginHorizontal: -theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    height: 56,
  },
  logo: { width: 24, height: 24, borderRadius: 6, backgroundColor: theme.colors.white, transform: [{ rotate: "20deg" }] },
  wordmark: { color: theme.colors.white, fontSize: 19, fontWeight: "800" },
  headerIcon: { color: theme.colors.white, fontSize: 20, marginLeft: theme.spacing[3] },
  chipRow: { gap: theme.spacing[2], paddingVertical: theme.spacing[3] },
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
  sectionTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing[3] },
});
