import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSearch } from "../lib/queries";
import { ScreenshotEmpty } from "../components/ui";
import { TextField } from "../components/form";
import { theme } from "../theme";
import type { RootStackNavigation, TabParamList } from "../navigation/types";

export function SearchScreen() {
  const route = useRoute<RouteProp<TabParamList, "Search">>();
  const [q, setQ] = useState(route.params?.q ?? "");
  const { data, isFetching } = useSearch(q);
  const navigation = useNavigation<RootStackNavigation>();

  useEffect(() => {
    if (route.params?.q) setQ(route.params.q);
  }, [route.params?.q]);

  const trimmed = q.trim();

  return (
    <View style={styles.container}>
      <TextField
        value={q}
        onChangeText={setQ}
        placeholder="Search news..."
        autoFocus
        returnKeyType="search"
      />
      {isFetching && <Text style={styles.searching}>Searching…</Text>}
      {!isFetching && trimmed.length > 0 && (!data || data.length === 0) && (
        <ScreenshotEmpty icon="&#128269;" message={`No results for "${trimmed}".`} />
      )}
      {trimmed.length === 0 && (
        <ScreenshotEmpty icon="&#128269;" message="Search for topics, people or keywords." />
      )}
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("Article", { slug: item.slug })}
            style={styles.result}
          >
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.resultSummary}>
              {item.summary}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing[4] },
  searching: { color: theme.colors.muted, marginBottom: theme.spacing[2] },
  result: {
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.white,
  },
  resultTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  resultSummary: { fontSize: 12, color: theme.colors.muted, marginTop: 4, lineHeight: 18 },
});
