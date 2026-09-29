import { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { theme } from "../theme";
import { PrimaryButton } from "../components/form";
import type { RootStackNavigation } from "../navigation/types";

const { width } = Dimensions.get("window");

const SLIDES = [
  { icon: "\u{1F4F0}", title: "Local news, first", body: "Verified reporting from your district, updated through the day." },
  { icon: "\u{1F514}", title: "Never miss a story", body: "Follow topics and reporters, and get notified when it matters." },
  { icon: "\u{1F4F8}", title: "Read anywhere", body: "Save articles for later and read offline." },
];

export async function markOnboardingSeen() {
  await SecureStore.setItemAsync("nw_onboarding_seen", "1");
}

export function OnboardingScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  function next() {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      void finish();
    }
  }

  async function finish() {
    await markOnboardingSeen();
    navigation.replace("Tabs", { screen: "Home" });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <PrimaryButton label={index === SLIDES.length - 1 ? "Get started" : "Next"} onPress={next} />
        <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: theme.spacing[3] }}>
          <Text style={styles.loginLink}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  skip: { alignSelf: "flex-end", padding: theme.spacing[4] },
  skipText: { color: theme.colors.muted, fontWeight: "600" },
  slide: { alignItems: "center", justifyContent: "center", padding: theme.spacing[8] },
  icon: { fontSize: 96, marginBottom: theme.spacing[6] },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, textAlign: "center" },
  body: { fontSize: 15, color: theme.colors.muted, textAlign: "center", marginTop: theme.spacing[3], lineHeight: 22 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: theme.spacing[6] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { width: 22, backgroundColor: theme.colors.purple },
  actions: { paddingHorizontal: theme.spacing[6], paddingBottom: theme.spacing[8] },
  loginLink: { color: theme.colors.purple, fontWeight: "700", textAlign: "center" },
});
