import { FlatList, RefreshControl, Text, View } from "react-native";
import { Link } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFeed, type ArticleCard } from "../lib/queries";
import { ArticleRow, ArticleTile } from "../components/article-card";
import { ScreenshotEmpty, SkeletonRow } from "../components/ui";
import { theme } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Tabs">;

export function HomeScreen({ navigation }: Props) {
  const { data, isLoading, refetch, isRefetching } = useFeed();

  function open(slug: string) {
    (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate("Article", { slug });
  }

  if (isLoading) {
    return (
      <View style={{ padding: 16 }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    );
  }

  const articles = data ?? [];

  return (
    <FlatList<ArticleCard>
      data={articles}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.purple} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: theme.colors.text }}>Today&rsquo;s headlines</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Link to="/Search" style={{ color: theme.colors.purple, fontWeight: "700", fontSize: 13 }}>Search</Link>
            <Text style={{ color: theme.colors.muted }}>·</Text>
            <Link to="/Notifications" style={{ color: theme.colors.purple, fontWeight: "700", fontSize: 13 }}>Notifications</Link>
          </View>
        </View>
      }
      ListEmptyComponent={<ScreenshotEmpty icon="&#128240;" message="No published stories yet." />}
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
