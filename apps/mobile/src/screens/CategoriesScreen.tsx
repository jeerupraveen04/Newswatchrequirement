import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCategories } from "../lib/queries";
import { Card, ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

const FALLBACK = ["Politics", "Business", "Tech", "Sports", "World", "Entertainment", "Health", "Science"];

export function CategoriesScreen() {
  const { data, isLoading } = useCategories();
  const navigation = useNavigation<RootStackNavigation>();

  if (isLoading) {
    return (
      <View style={{ padding: theme.spacing[4] }}>
        <View style={{ height: 200, backgroundColor: theme.colors.border, borderRadius: theme.radius.lg }} />
      </View>
    );
  }

  const categories =
    data && data.length > 0
      ? data.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
      : FALLBACK.map((name) => ({ id: name, name, slug: name.toLowerCase() }));

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4] }}>
      <Text style={styles.title}>Categories</Text>
      {(!data || data.length === 0) && <Text style={styles.hint}>Showing sample categories.</Text>}
      {categories.length === 0 && <ScreenshotEmpty icon="&#9638;" message="No categories yet." />}
      <View style={styles.grid}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate("CategoryListing", { slug: c.slug, name: c.name })}
            style={styles.cell}
          >
            <Card style={styles.card}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.sub}>View articles</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing[3] },
  hint: { color: theme.colors.muted, fontSize: 12, marginBottom: theme.spacing[3] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[3] },
  cell: { width: "47%" },
  card: { padding: theme.spacing[5], alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
  sub: { fontSize: 12, color: theme.colors.muted, marginTop: 4 },
});
