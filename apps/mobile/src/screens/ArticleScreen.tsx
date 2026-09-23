import { ScrollView, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useArticle } from "../lib/queries";
import { theme } from "../theme";
import { Badge } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";

export function ArticleScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Article">>();
  const { data, isLoading } = useArticle(route.params.slug);

  if (isLoading || !data) {
    return (
      <View style={{ padding: 16 }}>
        <View style={{ height: 220, backgroundColor: "#eee", borderRadius: 16 }} />
        <View style={{ height: 24, backgroundColor: "#eee", borderRadius: 8, marginTop: 16 }} />
        <View style={{ height: 120, backgroundColor: "#eee", borderRadius: 8, marginTop: 12 }} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
      {data.heroMedia?.url ? (
        <View style={{ width: "100%", height: 240, backgroundColor: "#ddd" }}>
          {/* expo-image handles both; video hero via expo-video is a follow-up */}
          <Text style={{ position: "absolute", bottom: 12, left: 16 }}>
            <Badge tone="purple">{data.categories[0]?.name ?? "News"}</Badge>
          </Text>
        </View>
      ) : null}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", lineHeight: 30, color: data.headlineStyle?.color ?? theme.colors.text }}>
          {data.title}
        </Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: data.descriptionStyle?.color ?? theme.colors.mutedStrong, marginTop: 10 }}>
          {data.summary}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 10 }}>
          {data.reporter?.displayName ?? "NewsWatch"} · {data.tags.length} tags
        </Text>
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 16 }} />
        {/* Body is sanitized HTML from the API; rendered as plain text on mobile in v1. */}
        <Text style={{ fontSize: 16, lineHeight: 27, color: theme.colors.textSecondary }}>
          {data.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
        </Text>
      </View>
    </ScrollView>
  );
}
