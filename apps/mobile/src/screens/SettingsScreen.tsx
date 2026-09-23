import { Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";

export function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 16 }}>Settings</Text>
      <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, backgroundColor: "#fff", marginBottom: 16 }}>
        <Text style={{ fontWeight: "800", marginBottom: 12 }}>Account</Text>
        <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Email: {user?.email ?? "—"}</Text>
        <Text style={{ color: theme.colors.muted }}>Role: {user?.role ?? "guest"}</Text>
      </View>
      <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, backgroundColor: "#fff" }}>
        <Text style={{ fontWeight: "800", marginBottom: 12 }}>About</Text>
        <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>NewsWatch mobile</Text>
        <Text style={{ color: theme.colors.muted }}>Version 0.1.0</Text>
      </View>
      {user && (
        <Pressable onPress={logout} style={{ marginTop: 20, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" }}>
          <Text style={{ color: theme.colors.error, fontWeight: "700" }}>Log out</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
