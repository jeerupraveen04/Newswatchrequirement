import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/**
 * Deep links. Paths are lowercase and MUST match the config below, otherwise
 * React Navigation cannot parse them.
 * Examples: newswatch://news/<slug>, newswatch://search?q=news,
 *           https://newswatch.app/profile
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["newswatch://", "https://newswatch.app"],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: "",
          Categories: "categories",
          Search: "search",
          Bookmarks: "bookmarks",
          Profile: "profile",
        },
      },
      Article: "news/:slug",
      NewsListing: "news",
      CategoryListing: "categories/:slug",
      Notifications: "notifications",
      Settings: "settings",
      About: "about",
      EditProfile: "profile/edit",
      ReporterDashboard: "reporter",
      MyArticles: "reporter/articles",
      ArticleComposer: "reporter/compose/:articleId?",
      ReporterApply: "reporter/apply",
      SharePoster: "reporter/poster/:articleId",
      Login: "login",
      Signup: "signup",
      Otp: "otp",
      ForgotPassword: "forgot-password",
    },
  },
};
