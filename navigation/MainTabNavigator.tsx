import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import GoalsStackNavigator from "./GoalsStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";
import ProfileTabBarIcon from "./ProfileTabBarIcon";
import { TabBarProfileProvider } from "./TabBarProfileContext";
import { COLORS, TAB_BAR } from "../utils/theme";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <TabBarProfileProvider>
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontSize: TAB_BAR.labelFontSize,
            fontWeight: TAB_BAR.labelFontWeight,
            letterSpacing: TAB_BAR.labelLetterSpacing,
          },
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopColor: COLORS.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="target" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: (props) => <ProfileTabBarIcon {...props} />,
          }}
        />
      </Tab.Navigator>
    </TabBarProfileProvider>
  );
}
