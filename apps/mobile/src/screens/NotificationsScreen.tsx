import { FlatList, Text, View } from "react-native";
import { useNotifications } from "../lib/queries";
import { ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";

export function NotificationsScreen() {
  const { data, isLoading } = useNotifications();

  if (isLoading) return <View style={{ padding: 16 }}><View style={{ height: 80, backgroundColor: "#eee", borderRadius: 12 }} /></View>;

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: "800" }}>Notifications</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{data?.unread ?? 0} unread</Text>
        </View>
      }
      ListEmptyComponent={<ScreenshotEmpty icon="&#128276;" message="Nothing here yet." />}
      renderItem={({ item }) => (
        <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, marginBottom: 10, backgroundColor: "#fff", borderLeftWidth: item.read ? 1 : 3, borderLeftColor: item.read ? theme.colors.border : theme.colors.purple }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>{item.title}</Text>
          <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 4 }}>{item.body}</Text>
        </View>
      )}
    />
  );
}
