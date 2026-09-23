import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { theme } from "../theme";

export function Badge({ children, tone = "muted" }: { children: string; tone?: "purple" | "muted" | "success" | "warning" | "error" }) {
  const bg =
    tone === "purple" ? theme.colors.purple
    : tone === "success" ? "rgba(22,163,74,0.12)"
    : tone === "warning" ? "rgba(217,119,6,0.12)"
    : tone === "error" ? "rgba(220,38,38,0.12)"
    : "#f0f0f0";
  const fg =
    tone === "purple" ? "#fff"
    : tone === "success" ? theme.colors.success
    : tone === "warning" ? theme.colors.warning
    : tone === "error" ? theme.colors.error
    : theme.colors.mutedStrong;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: "700" }}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenshotEmpty({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 44 }}>{icon}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 12, textAlign: "center" }}>{message}</Text>
    </View>
  );
}

export function SkeletonRow() {
  return <View style={[styles.skeleton, { height: 76, marginBottom: 12 }]} />;
}

export const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.sm, alignSelf: "flex-start" },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: "hidden",
  },
  empty: { padding: 60, alignItems: "center", justifyContent: "center" },
  skeleton: { backgroundColor: "#eee", borderRadius: theme.radius.md },
});
