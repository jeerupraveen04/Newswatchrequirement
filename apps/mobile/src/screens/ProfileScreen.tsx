import { ScrollView, Text, View, Pressable } from "react-native";
import { Link } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={{ padding: 24, alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 8 }}>Welcome to NewsWatch</Text>
        <Text style={{ color: theme.colors.muted, textAlign: "center", marginBottom: 20 }}>
          Log in to save articles, comment and follow topics.
        </Text>
        <Link to="/Login" style={{ color: theme.colors.purple, fontWeight: "700", fontSize: 16 }}>Log in</Link>
        <Link to="/Signup" style={{ color: theme.colors.mutedStrong, fontWeight: "600", marginTop: 12 }}>Create an account</Link>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ alignItems: "center", marginVertical: 20 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.purple, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>{user.displayName.charAt(0)}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 12 }}>{user.displayName}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 13 }}>@{user.username} · {user.role}</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Link to="/Notifications" style={rowStyle}>Notifications</Link>
        <Link to="/Search" style={rowStyle}>Search</Link>
        <Link to="/Settings" style={rowStyle}>Settings</Link>
      </View>

      <Pressable onPress={logout} style={{ marginTop: 24, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" }}>
        <Text style={{ color: theme.colors.error, fontWeight: "700" }}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const rowStyle = {
  padding: 14,
  borderRadius: theme.radius.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: "#fff",
  color: theme.colors.text,
  fontWeight: "600" as const,
};
