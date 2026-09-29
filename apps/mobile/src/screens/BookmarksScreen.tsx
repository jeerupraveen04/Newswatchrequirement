import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { useBookmarks } from "../lib/queries";
import { ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

export function BookmarksScreen() {
  const user = useAuth((s) => s.user);
  const { data, isLoading } = useBookmarks();
  const navigation = useNavigation<RootStackNavigation>();

  if (!user) {
    return (
      <View style={styles.center}>
        <ScreenshotEmpty icon="&#9873;" message="Log in to save articles for later." />
        <Pressable style={styles.login} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>Log in</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ padding: theme.spacing[4] }}>
        <View style={{ height: 80, backgroundColor: theme.colors.border, borderRadius: theme.radius.lg }} />
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(b) => b.articleId}
      contentContainerStyle={{ padding: theme.spacing[4] }}
      ListHeaderComponent={<Text style={styles.title}>Saved</Text>}
      ListEmptyComponent={<ScreenshotEmpty icon="&#9873;" message="No saved articles yet." />}
      renderItem={({ item }) => (
        <Pressable onPress={() => navigation.navigate("Article", { slug: item.article.slug })} style={styles.row}>
          <Text style={styles.rowTitle}>{item.article.title}</Text>
          <Text numberOfLines={2} style={styles.rowSummary}>
            {item.article.summary}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing[6] },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing[4] },
  row: {
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.white,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  rowSummary: { fontSize: 12, color: theme.colors.muted, marginTop: 4, lineHeight: 18 },
  login: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.md,
    paddingHorizontal: 32,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: { color: theme.colors.white, fontWeight: "700" },
});

