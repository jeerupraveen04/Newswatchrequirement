import { FlatList, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBookmarks } from "../lib/queries";
import { ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";

export function BookmarksScreen() {
  const { data, isLoading } = useBookmarks();
  const navigation = useNavigation();

  if (isLoading) return <View style={{ padding: 16 }}><View style={{ height: 80, backgroundColor: "#eee", borderRadius: 12 }} /></View>;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(b) => b.articleId}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={<Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 16 }}>Saved</Text>}
      ListEmptyComponent={<ScreenshotEmpty icon="&#9873;" message="No saved articles yet." />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate("Article", { slug: item.article.slug })}
          style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, marginBottom: 10, backgroundColor: "#fff" }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>{item.article.title}</Text>
          <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 4 }}>{item.article.summary}</Text>
        </Pressable>
      )}
    />
  );
}
