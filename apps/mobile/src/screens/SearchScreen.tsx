import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSearch } from "../lib/queries";
import { ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";
import { inputStyle } from "./LoginScreen";

export function SearchScreen() {
  const [q, setQ] = useState("");
  const { data, isFetching } = useSearch(q);
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search news..."
        autoFocus
        style={inputStyle}
      />
      {isFetching && <Text style={{ color: theme.colors.muted, marginBottom: 8 }}>Searching…</Text>}
      {!isFetching && q.trim() && (!data || data.length === 0) && (
        <ScreenshotEmpty icon="&#128269;" message={`No results for "${q}".`} />
      )}
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate("Article", { slug: item.slug })}
            style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, marginBottom: 10, backgroundColor: "#fff" }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>{item.title}</Text>
            <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 4 }}>{item.summary}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
