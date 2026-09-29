import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../lib/auth";
import { theme } from "../theme";
import type { RootStackNavigation } from "../navigation/types";

export function SplashScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const { hydrated, user } = useAuth((s) => ({ hydrated: s.hydrated, user: s.user }));

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(async () => {
      const seen = await SecureStore.getItemAsync("nw_onboarding_seen");
      if (!seen) navigation.replace("Onboarding");
      else navigation.replace("Tabs", { screen: "Home" });
    }, 900);
    return () => clearTimeout(timer);
  }, [hydrated, user, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logo} />
      <Text style={styles.wordmark}>newswatch</Text>
      <Text style={styles.tagline}>Local news, clearly told.</Text>
      <ActivityIndicator color={theme.colors.white} style={{ marginTop: theme.spacing[8] }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.purple, alignItems: "center", justifyContent: "center" },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: theme.colors.white, transform: [{ rotate: "20deg" }] },
  wordmark: { color: theme.colors.white, fontSize: 28, fontWeight: "800", marginTop: theme.spacing[5] },
  tagline: { color: "rgba(255,255,255,0.85)", marginTop: 6 },
});
