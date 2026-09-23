import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/** Deep links: newswatch://news/<slug>, newswatch://search, etc. */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["newswatch://", "https://newswatch.app"],
  config: {
    screens: {
      Tabs: {
        screens: { Home: "", Categories: "categories", Bookmarks: "bookmarks", Profile: "profile" },
      },
      Article: "news/:slug",
      Search: "search",
      Notifications: "notifications",
      Settings: "settings",
      Login: "login",
      Signup: "signup",
    },
  },
};
