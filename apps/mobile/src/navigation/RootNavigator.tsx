import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import type { RootStackParamList, TabParamList } from "./types";
import { linking } from "./linking";
import { HomeScreen } from "../screens/HomeScreen";
import { ArticleScreen } from "../screens/ArticleScreen";
import { CategoriesScreen } from "../screens/CategoriesScreen";
import { BookmarksScreen } from "../screens/BookmarksScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { CommentsScreen } from "../screens/CommentsScreen";
import { CategoryListingScreen } from "../screens/CategoryListingScreen";
import { NewsListingScreen } from "../screens/NewsListingScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ReporterDashboardScreen } from "../screens/ReporterDashboardScreen";
import { MyArticlesScreen } from "../screens/MyArticlesScreen";
import { ArticleComposerScreen } from "../screens/ArticleComposerScreen";
import { ReporterApplyScreen } from "../screens/ReporterApplyScreen";
import { SharePosterScreen } from "../screens/SharePosterScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.purple,
    background: theme.colors.background,
    card: theme.colors.white,
    text: theme.colors.text,
    border: theme.colors.border,
  },
};

const GLYPHS: Record<keyof TabParamList, string> = {
  Home: "\u2302",
  Categories: "\u25A6",
  Search: "\u2315",
  Bookmarks: "\u2691",
  Profile: "\u263A",
};

function TabIcon({ label, focused }: { label: keyof TabParamList; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 20, color: focused ? theme.colors.purple : theme.colors.muted }}>{GLYPHS[label]}</Text>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.purple,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { paddingTop: 4 },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tabs.Screen name="Categories" component={CategoriesScreen} options={{ title: "Categories" }} />
      <Tabs.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Tabs.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: "Bookmarks" }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tabs.Navigator>
  );
}

const screenHeader = {
  headerStyle: { backgroundColor: theme.colors.white },
  headerTintColor: theme.colors.purple,
  headerTitleStyle: { color: theme.colors.text, fontWeight: "800" as const },
  headerShadowVisible: false,
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator screenOptions={screenHeader} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Article" component={ArticleScreen} options={{ title: "" }} />
        <Stack.Screen name="NewsListing" component={NewsListingScreen} options={{ title: "News" }} />
        <Stack.Screen name="CategoryListing" component={CategoryListingScreen} options={{ title: "" }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: "About" }} />
        <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: "Comments" }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: "modal", title: "Log in" }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ presentation: "modal", title: "Sign up" }} />
        <Stack.Screen name="Otp" component={OtpScreen} options={{ title: "Verify" }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Reset password" }} />
        <Stack.Screen name="ReporterDashboard" component={ReporterDashboardScreen} options={{ title: "Reporter" }} />
        <Stack.Screen name="MyArticles" component={MyArticlesScreen} options={{ title: "My Articles" }} />
        <Stack.Screen name="ArticleComposer" component={ArticleComposerScreen} options={{ title: "Composer" }} />
        <Stack.Screen name="ReporterApply" component={ReporterApplyScreen} options={{ title: "Become a Reporter" }} />
        <Stack.Screen name="SharePoster" component={SharePosterScreen} options={{ title: "Share Poster" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 58,
    paddingBottom: 6,
    paddingTop: 4,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  tabIcon: { alignItems: "center", justifyContent: "center" },
});
