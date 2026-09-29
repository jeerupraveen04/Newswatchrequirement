import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<RootStackNavigation>();

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4] }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.row}>Email: {user?.email ?? "—"}</Text>
        <Text style={styles.row}>Role: {user?.role ?? "guest"}</Text>
        {user ? (
          <Pressable onPress={() => navigation.navigate("EditProfile")} style={styles.linkRow}>
            <Text style={styles.link}>Edit profile</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>More</Text>
        <Pressable onPress={() => navigation.navigate("About")} style={styles.linkRow}>
          <Text style={styles.link}>About NewsWatch</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("MyArticles")} style={styles.linkRow}>
          <Text style={styles.link}>My articles</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("ReporterDashboard")} style={styles.linkRow}>
          <Text style={styles.link}>Reporter dashboard</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.row}>NewsWatch mobile</Text>
        <Text style={styles.row}>Version 0.1.0</Text>
      </View>

      {user ? (
        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing[4],
  },
  cardTitle: { fontWeight: "800", marginBottom: theme.spacing[3], color: theme.colors.text },
  row: { color: theme.colors.muted, marginBottom: 6 },
  linkRow: { paddingVertical: 8 },
  link: { color: theme.colors.purple, fontWeight: "700" },
  logout: {
    marginTop: theme.spacing[3],
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  logoutText: { color: theme.colors.error, fontWeight: "700" },
});
