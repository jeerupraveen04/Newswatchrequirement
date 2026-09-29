import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { useMyArticles, useReporterProfile, useReporterStats, formatRelative } from "../lib/queries";
import { theme } from "../theme";
import { Badge, ScreenshotEmpty } from "../components/ui";
import type { RootStackNavigation } from "../navigation/types";

export function ReporterDashboardScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const user = useAuth((s) => s.user);
  const { data: profile, refetch: refetchProfile } = useReporterProfile();
  const { data: stats, refetch: refetchStats, isRefetching } = useReporterStats();
  const { data: articles, refetch: refetchArticles } = useMyArticles();

  const approved = profile?.status === "approved";
  const recent = (articles ?? []).slice(0, 5);

  function refresh() {
    void refetchProfile();
    void refetchStats();
    void refetchArticles();
  }

  if (profile && !approved) {
    return (
      <ScrollView contentContainerStyle={styles.locked}>
        <View style={styles.lockedIcon}>
          <Text style={{ fontSize: 40 }}>{"\u23F3"}</Text>
        </View>
        <Text style={styles.lockedTitle}>
          {profile.status === "pending" ? "Application under review" : "Reporter access required"}
        </Text>
        <Text style={styles.lockedText}>
          {profile.status === "pending"
            ? "An admin is reviewing your application. You'll be able to publish once approved."
            : "Apply to become a reporter to start publishing articles."}
        </Text>
        <Pressable style={styles.applyButton} onPress={() => navigation.navigate("ReporterApply")}>
          <Text style={styles.applyText}>{profile.status === "pending" ? "View application" : "Apply now"}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={styles.locked}>
        <Text style={styles.lockedTitle}>Become a reporter</Text>
        <Text style={styles.lockedText}>Publish news stories for your region.</Text>
        <Pressable style={styles.applyButton} onPress={() => navigation.navigate("ReporterApply")}>
          <Text style={styles.applyText}>Apply now</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[4], paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={theme.colors.purple} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hello, {user?.displayName?.split(" ")[0] ?? "Reporter"}</Text>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              <Badge tone="success">Approved reporter</Badge>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={styles.bell}>
            <Text style={{ fontSize: 20 }}>{"\u{1F514}"}</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Overview</Text>
        <View style={styles.statGrid}>
          <Stat label="Published" value={stats?.published ?? 0} onPress={() => navigation.navigate("MyArticles", { status: "published" })} />
          <Stat label="Pending" value={stats?.pending ?? 0} onPress={() => navigation.navigate("MyArticles", { status: "pending" })} />
          <Stat label="Drafts" value={stats?.draft ?? 0} onPress={() => navigation.navigate("MyArticles", { status: "draft" })} />
          <Stat label="Views" value={stats?.views ?? 0} onPress={() => navigation.navigate("MyArticles")} />
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.section}>Recent articles</Text>
          <Pressable onPress={() => navigation.navigate("MyArticles")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <ScreenshotEmpty icon="&#128196;" message="No articles yet. Tap New Article to start." />
        ) : (
          recent.map((a) => (
            <Pressable
              key={a.id}
              style={styles.row}
              onPress={() =>
                a.status === "published"
                  ? navigation.navigate("Article", { slug: a.slug })
                  : navigation.navigate("ArticleComposer", { articleId: a.id })
              }
            >
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.rowTitle}>
                  {a.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <StatusBadge status={a.status} />
                  <Text style={styles.rowMeta}>{formatRelative(a.updatedAt)}</Text>
                </View>
                {a.status === "rejected" && a.reviewNote ? <Text style={styles.rejectNote}>{a.reviewNote}</Text> : null}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate("ArticleComposer", {})}>
        <Text style={styles.fabText}>+ New Article</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "published" ? "success" : status === "pending" ? "warning" : status === "rejected" ? "error" : "muted";
  return <Badge tone={tone as "success" | "warning" | "error" | "muted"}>{status}</Badge>;
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hello: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border },
  section: { fontSize: 16, fontWeight: "800", color: theme.colors.text, marginTop: theme.spacing[5], marginBottom: theme.spacing[3] },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[3] },
  statCard: {
    width: "47%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing[4],
  },
  statValue: { fontSize: 26, fontWeight: "800", color: theme.colors.purple },
  statLabel: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  recentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing[5] },
  link: { color: theme.colors.purple, fontWeight: "700", fontSize: 13 },
  row: {
    flexDirection: "row",
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing[3],
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  rowMeta: { fontSize: 12, color: theme.colors.muted },
  rejectNote: { color: theme.colors.error, fontSize: 12, marginTop: 6 },
  fab: {
    position: "absolute",
    left: theme.spacing[4],
    right: theme.spacing[4],
    bottom: theme.spacing[4],
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.pill,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: theme.colors.white, fontWeight: "800", fontSize: 15 },
  locked: { padding: theme.spacing[6], alignItems: "center", justifyContent: "center", flexGrow: 1 },
  lockedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.purpleLight, alignItems: "center", justifyContent: "center", marginBottom: theme.spacing[5] },
  lockedTitle: { fontSize: 20, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
  lockedText: { color: theme.colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  applyButton: { marginTop: theme.spacing[5], backgroundColor: theme.colors.purple, borderRadius: theme.radius.md, paddingHorizontal: 32, height: 46, alignItems: "center", justifyContent: "center" },
  applyText: { color: theme.colors.white, fontWeight: "700" },
});
