import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, formatRelative, type Notification } from "../lib/queries";
import { ScreenshotEmpty } from "../components/ui";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

export function NotificationsScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  function open(item: Notification) {
    if (!item.read) markRead.mutate(item.id);
    const link = item.deepLink ?? "";
    const slugMatch = link.match(/news\/([^/?]+)/);
    if (slugMatch?.[1]) return navigation.navigate("Article", { slug: slugMatch[1] });
    if (link.includes("reporter")) return navigation.navigate("ReporterDashboard");
  }

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: theme.spacing[4] }}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.sub}>{data?.unread ?? 0} unread</Text>
          </View>
          {(data?.unread ?? 0) > 0 ? (
            <Pressable onPress={() => markAll.mutate()}>
              <Text style={styles.markAll}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListEmptyComponent={!isLoading ? <ScreenshotEmpty icon="&#128276;" message="Nothing here yet." /> : null}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => open(item)}
          style={[styles.row, { borderLeftWidth: item.read ? 1 : 3, borderLeftColor: item.read ? theme.colors.border : theme.colors.purple }]}
        >
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text numberOfLines={2} style={styles.rowBody}>
            {item.body}
          </Text>
          <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: theme.spacing[3] },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  sub: { color: theme.colors.muted, marginTop: 2, fontSize: 13 },
  markAll: { color: theme.colors.purple, fontWeight: "700", fontSize: 13, marginTop: 6 },
  row: {
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.white,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  rowBody: { fontSize: 13, color: theme.colors.muted, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: theme.colors.muted, marginTop: 6 },
});
