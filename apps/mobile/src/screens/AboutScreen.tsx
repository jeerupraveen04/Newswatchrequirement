import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logo} />
      <Text style={styles.brand}>newswatch</Text>
      <Text style={styles.tagline}>Local news, clearly told.</Text>

      <Section title="About us">
        NewsWatch delivers verified local and regional news — politics, business, technology,
        sports and culture — from reporters who live in the communities they cover.
      </Section>
      <Section title="Our mission">
        Trustworthy, timely reporting for every district. No paywalls on public-interest stories.
      </Section>
      <Section title="Contact">{"hello@newswatch.app\nPress: press@newswatch.app"}</Section>
      <Section title="Legal">
        Terms of Service · Privacy Policy · Content Policy
      </Section>

      <Text style={styles.version}>Version 0.1.0</Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing[5], alignItems: "center" },
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: theme.colors.purple, transform: [{ rotate: "20deg" }], marginTop: theme.spacing[5] },
  brand: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginTop: theme.spacing[4] },
  tagline: { color: theme.colors.muted, marginTop: 4, marginBottom: theme.spacing[6] },
  section: { alignSelf: "stretch", marginBottom: theme.spacing[5] },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.text, marginBottom: 6 },
  sectionBody: { color: theme.colors.mutedStrong, fontSize: 14, lineHeight: 21 },
  version: { color: theme.colors.muted, fontSize: 12, marginTop: theme.spacing[4] },
});
