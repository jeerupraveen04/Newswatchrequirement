import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCategories } from "../lib/queries";
import { Card, ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";

export function CategoriesScreen() {
  const { data, isLoading } = useCategories();
  const navigation = useNavigation();

  if (isLoading) return <View style={{ padding: 16 }}><View style={{ height: 200, backgroundColor: "#eee", borderRadius: 12 }} /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 16 }}>Categories</Text>
      {(!data || data.length === 0) && <ScreenshotEmpty icon="&#9638;" message="No categories yet." />}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {data?.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate("Search", { q: c.name })}
            style={{ width: "47%" }}
          >
            <Card style={{ padding: 18, alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: theme.colors.text }}>{c.name}</Text>
              <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 4 }}>View articles</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
