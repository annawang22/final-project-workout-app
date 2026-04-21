import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { navigationRef } from "./navigation/navigationRef";
import MainTabNavigator from "./navigation/MainTabNavigator";
import type { RootStackParamList } from "./navigation/types";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import {
  getUsers,
  isLoggedIn,
  recoverActiveUserIfNeeded,
  refreshDebugDateOverrideCache,
} from "./utils/storage";
import { LIGHT_COLORS, loadDarkModePreference } from "./utils/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

type AuthTarget = keyof RootStackParamList;

function ThemedRootNavigator({ initialRoute }: { initialRoute: AuthTarget }) {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ title: "Sign up" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Log in" }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [boot, setBoot] = useState<{
    resolved: boolean;
    initialRoute: AuthTarget | null;
    isDark: boolean;
  }>({ resolved: false, initialRoute: null, isDark: false });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const isDark = await loadDarkModePreference();
      await recoverActiveUserIfNeeded();
      await refreshDebugDateOverrideCache();
      const users = await getUsers();
      const loggedIn = await isLoggedIn();
      if (cancelled) {
        return;
      }
      let route: AuthTarget;
      if (users.length === 0) {
        route = "Signup";
      } else if (loggedIn) {
        route = "Main";
      } else {
        route = "Login";
      }
      setBoot({ resolved: true, initialRoute: route, isDark });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!boot.resolved || boot.initialRoute == null) {
    return (
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: LIGHT_COLORS.background }}
      >
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: LIGHT_COLORS.background,
            }}
          >
            <ActivityIndicator size="large" color={LIGHT_COLORS.primary} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialDarkMode={boot.isDark}>
          <NavigationContainer ref={navigationRef}>
            <ThemedRootNavigator initialRoute={boot.initialRoute} />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
