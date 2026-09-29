import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type ViewToken } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { useFeed, formatCount, formatRelative, type ArticleCard } from "../lib/queries";
import { theme } from "../theme";
import { Badge, ScreenshotEmpty } from "../components/ui";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

const { height } = Dimensions.get("window");
const CARD_HEIGHT = height - 90;

export function NewsListingScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "NewsListing">>();
  const categoryName = route.params?.categoryName;
  const { data, isLoading } = useFeed();
  const articles = data?.items ?? [];

  return (
    <FlatList<ArticleCard>
      data={articles}
      keyExtractor={(a) => a.id}
      pagingEnabled
      snapToInterval={CARD_HEIGHT}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={!isLoading ? <ScreenshotEmpty icon="&#128240;" message="No stories yet." /> : null}
      renderItem={({ item, index }) => (
        <View style={[styles.page, { height: CARD_HEIGHT }]}>
          <View style={styles.hero}>
            {item.heroMedia?.url ? (
              <Image source={{ uri: item.heroMedia.posterUrl ?? item.heroMedia.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.purpleLight }]} />
            )}
            <View style={styles.badge}>
              <Badge tone="purple">{item.categories[0]?.name ?? categoryName ?? "News"}</Badge>
            </View>
            <Text style={styles.counter}>
              {index + 1}/{articles.length}
            </Text>
          </View>
          <View style={{ flex: 1, padding: theme.spacing[4] }}>
            <Text numberOfLines={3} style={styles.title}>
              {item.title}
            </Text>
            <Text numberOfLines={3} style={styles.summary}>
              {item.summary}
            </Text>
            <Text style={styles.meta}>
              NewsWatch · {formatRelative(item.publishedAt)} · {formatCount(item.viewCount)} views
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.readButton} onPress={() => navigation.navigate("Article", { slug: item.slug })}>
              <Text style={styles.readText}>Read full story</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: theme.colors.white },
  hero: { height: 300, backgroundColor: theme.colors.border },
  badge: { position: "absolute", bottom: theme.spacing[3], left: theme.spacing[4] },
  counter: {
    position: "absolute",
    bottom: theme.spacing[3],
    right: theme.spacing[4],
    color: theme.colors.white,
    backgroundColor: theme.colors.scrim,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: "hidden",
    fontSize: 12,
  },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, lineHeight: 30 },
  summary: { fontSize: 15, color: theme.colors.mutedStrong, marginTop: theme.spacing[3], lineHeight: 22 },
  meta: { fontSize: 12, color: theme.colors.muted, marginTop: theme.spacing[3] },
  readButton: { backgroundColor: theme.colors.purple, borderRadius: theme.radius.md, height: 48, alignItems: "center", justifyContent: "center" },
  readText: { color: theme.colors.white, fontWeight: "700" },
});
