import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { Badge } from "./ui";
import { formatRelative, type ArticleCard } from "../lib/queries";

export function ArticleTile({ article, onPress }: { article: ArticleCard; onPress: () => void }) {
  const hero = article.heroMedia;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {hero?.url ? (
        <Image source={{ uri: hero.posterUrl ?? hero.url }} style={styles.hero} contentFit="cover" />
      ) : (
        <View style={[styles.hero, { backgroundColor: theme.colors.purpleLight }]} />
      )}
      <View style={{ padding: 16 }}>
        {article.categories[0] && (
          <View style={{ position: "absolute", top: -22, left: 16 }}>
            <Badge tone="purple">{article.categories[0].name}</Badge>
          </View>
        )}
        <Text style={[styles.title, article.headlineStyle?.color ? { color: article.headlineStyle.color } : null]}>
          {article.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.summary, article.descriptionStyle?.color ? { color: article.descriptionStyle.color } : null]}
        >
          {article.summary}
        </Text>
        <Text style={styles.meta}>
          {formatRelative(article.publishedAt)} · {article.viewCount} views
        </Text>
      </View>
    </Pressable>
  );
}

export function ArticleRow({ article, onPress }: { article: ArticleCard; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {article.heroMedia?.url ? (
        <Image source={{ uri: article.heroMedia.posterUrl ?? article.heroMedia.url }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: "#ddd" }]} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={styles.rowTitle}>{article.title}</Text>
        <Text style={styles.meta}>
          {article.categories[0]?.name ?? "News"} · {formatRelative(article.publishedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: theme.radius.xl, overflow: "hidden", marginBottom: 16, elevation: 2 },
  hero: { width: "100%", height: 220 },
  title: { fontSize: 20, fontWeight: "800", lineHeight: 25, marginTop: 6, color: theme.colors.text },
  summary: { fontSize: 14, lineHeight: 21, marginTop: 6, color: theme.colors.mutedStrong },
  meta: { fontSize: 12, color: theme.colors.muted, marginTop: 8 },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: "#fff",
    marginBottom: 10,
    alignItems: "center",
  },
  thumb: { width: 84, height: 60, borderRadius: theme.radius.md },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text, lineHeight: 20 },
});
