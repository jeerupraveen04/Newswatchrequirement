import { ScrollView, Share, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { useArticle, useToggleBookmark, useToggleLike, formatCount, formatRelative } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import { Badge } from "../components/ui";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

export function ArticleScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "Article">>();
  const user = useAuth((s) => s.user);
  const { data, isLoading } = useArticle(route.params.slug);
  const like = useToggleLike();
  const bookmark = useToggleBookmark();

  if (isLoading || !data) {
    return (
      <View style={{ padding: theme.spacing[4] }}>
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { height: 120, marginTop: theme.spacing[3] }]} />
      </View>
    );
  }

  function requireAuth(action: () => void) {
    if (!user) return navigation.navigate("Login");
    action();
  }

  async function share() {
    await Share.share({ message: `https://newswatch.app/news/${data!.slug}\n\n${data!.title}` });
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.hero}>
        {data.heroMedia?.url ? (
          <Image source={{ uri: data.heroMedia.posterUrl ?? data.heroMedia.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.purpleLight }]} />
        )}
        <View style={styles.heroBadge}>
          <Badge tone="purple">{data.categories[0]?.name ?? "News"}</Badge>
        </View>
      </View>

      <View style={{ padding: theme.spacing[4] }}>
        <Text style={[styles.title, data.headlineStyle?.color ? { color: data.headlineStyle.color } : null]}>{data.title}</Text>
        <Text style={styles.meta}>
          {data.reporter?.displayName ?? "NewsWatch"} · {formatRelative(data.publishedAt)} · {data.readingMinutes} min read
        </Text>
        <Text style={[styles.summary, data.descriptionStyle?.color ? { color: data.descriptionStyle.color } : null]}>{data.summary}</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{data.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</Text>

        {data.tags.length > 0 ? (
          <View style={styles.tags}>
            {data.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.actionBar}>
        <Action glyph="\u2661" label={formatCount(data.likeCount)} onPress={() => requireAuth(() => like.mutate({ targetType: "article", targetId: data.id }))} />
        <Action glyph="\u{1F4AC}" label={formatCount(data.commentCount)} onPress={() => navigation.navigate("Comments", { articleId: data.id, title: data.title })} />
        <Action glyph="\u2691" label="Save" onPress={() => requireAuth(() => bookmark.mutate(data.id))} />
        <Action glyph="\u21AA" label="Share" onPress={() => void share()} />
      </View>
    </ScrollView>
  );
}

function Action({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Text style={styles.actionGlyph}>{glyph}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 260, backgroundColor: theme.colors.border },
  heroBadge: { position: "absolute", bottom: theme.spacing[3], left: theme.spacing[4] },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 30, color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.muted, marginTop: theme.spacing[3] },
  summary: { fontSize: 15, lineHeight: 22, color: theme.colors.mutedStrong, marginTop: theme.spacing[3] },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing[4] },
  body: { fontSize: 16, lineHeight: 27, color: theme.colors.textSecondary },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: theme.spacing[5] },
  tag: { backgroundColor: theme.colors.purpleLight, borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: theme.colors.purple, fontSize: 12, fontWeight: "600" },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing[3],
    marginTop: theme.spacing[3],
  },
  action: { alignItems: "center", gap: 2 },
  actionGlyph: { fontSize: 20, color: theme.colors.purple },
  actionLabel: { fontSize: 11, color: theme.colors.muted },
  skeletonHero: { height: 220, backgroundColor: theme.colors.border, borderRadius: theme.radius.xl },
  skeletonLine: { height: 24, backgroundColor: theme.colors.border, borderRadius: theme.radius.md, marginTop: theme.spacing[4] },
});
