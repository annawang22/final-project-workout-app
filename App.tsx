import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { navigationRef } from "./navigation/navigationRef";
import MainTabNavigator from "./navigation/MainTabNavigator";
import type { RootStackParamList } from "./navigation/types";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import { getUsers, isLoggedIn } from "./utils/storage";

const Stack = createNativeStackNavigator<RootStackParamList>();

type AuthTarget = keyof RootStackParamList;

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<AuthTarget | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const users = await getUsers();
      const loggedIn = await isLoggedIn();
      if (cancelled) {
        return;
      }
      if (users.length === 0) {
        setInitialRoute("Signup");
      } else if (loggedIn) {
        setInitialRoute("Main");
      } else {
        setInitialRoute("Login");
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || initialRoute == null) {
    return (
      <SafeAreaProvider>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerBackTitle: "Back" }}
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
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
