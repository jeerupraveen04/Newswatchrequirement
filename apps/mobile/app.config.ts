import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NewsWatch",
  slug: "newswatch",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "newswatch",
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  splash: {
    backgroundColor: "#8a007a",
    resizeMode: "contain",
  },
  ios: { supportsTablet: true, bundleIdentifier: "app.newswatch.mobile" },
  android: { package: "app.newswatch.mobile", adaptiveIcon: { backgroundColor: "#8a007a" } },
  plugins: ["expo-secure-store", "expo-linking", "expo-video"],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4010/api/v1",
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:4010",
  },
});
