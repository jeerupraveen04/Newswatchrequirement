import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<RootStackNavigation>();

  if (!user) {
    return (
      <View style={styles.guest}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N</Text>
        </View>
        <Text style={styles.welcome}>Welcome to NewsWatch</Text>
        <Text style={styles.guestText}>Log in to save articles, comment and follow topics.</Text>
        <Pressable style={styles.primary} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryText}>Log in</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.secondary}>Create an account</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("ReporterApply")} style={{ marginTop: theme.spacing[5] }}>
          <Text style={styles.secondary}>Become a reporter</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4] }}>
      <View style={styles.headerBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.meta}>
          @{user.username} · {user.role}
        </Text>
      </View>

      <View style={{ gap: theme.spacing[2] }}>
        <Row label="Edit profile" onPress={() => navigation.navigate("EditProfile")} />
        <Row label="My articles" onPress={() => navigation.navigate("MyArticles")} />
        <Row label="Reporter dashboard" onPress={() => navigation.navigate("ReporterDashboard")} />
        <Row label="Notifications" onPress={() => navigation.navigate("Notifications")} />
        <Row label="Bookmarks" onPress={() => navigation.navigate("Tabs", { screen: "Bookmarks" })} />
        <Row label="About" onPress={() => navigation.navigate("About")} />
        <Row label="Settings" onPress={() => navigation.navigate("Settings")} />
      </View>

      <Pressable onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Text style={styles.chevron}>{"\u203A"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guest: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing[6] },
  headerBlock: { alignItems: "center", marginVertical: theme.spacing[5] },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: theme.colors.white, fontSize: 26, fontWeight: "700" },
  welcome: { fontSize: 20, fontWeight: "800", marginTop: 12, color: theme.colors.text },
  name: { fontSize: 20, fontWeight: "800", marginTop: 12, color: theme.colors.text },
  meta: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  guestText: { color: theme.colors.muted, textAlign: "center", marginTop: 8, marginBottom: theme.spacing[5] },
  primary: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.md,
    paddingHorizontal: 32,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: theme.colors.white, fontWeight: "700", fontSize: 15 },
  secondary: { color: theme.colors.mutedStrong, fontWeight: "600", marginTop: theme.spacing[4] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  rowText: { color: theme.colors.text, fontWeight: "600", fontSize: 15 },
  chevron: { color: theme.colors.muted, fontSize: 22, lineHeight: 22 },
  logout: {
    marginTop: theme.spacing[6],
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  logoutText: { color: theme.colors.error, fontWeight: "700" },
});
