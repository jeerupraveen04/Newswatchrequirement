import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Search: { q?: string } | undefined;
  Bookmarks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Article: { slug: string };
  Notifications: undefined;
  Settings: undefined;
  Login: { redirect?: string } | undefined;
  Signup: undefined;
  Otp: { identifier: string; channel: "sms" | "email"; purpose?: "login" | "signup" | "reset" };
  ForgotPassword: undefined;
  EditProfile: undefined;
  Comments: { articleId: string; title?: string };
  CategoryListing: { slug: string; name: string };
  NewsListing: { categoryName?: string } | undefined;
  About: undefined;
  // Reporter
  ReporterDashboard: undefined;
  MyArticles: { status?: string } | undefined;
  ArticleComposer: { articleId?: string } | undefined;
  ReporterApply: undefined;
  SharePoster: { articleId: string; title: string; summary?: string };
};

export type RootStackNavigation = import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>;
