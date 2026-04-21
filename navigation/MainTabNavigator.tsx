import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import GoalsStackNavigator from "./GoalsStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";
import ProfileTabBarIcon from "./ProfileTabBarIcon";
import { TabBarProfileProvider } from "./TabBarProfileContext";

const Tab = createBottomTabNavigator();

const TAB_ACTIVE = "#222";
const TAB_INACTIVE = "#8e8e93";

export default function MainTabNavigator() {
  return (
    <TabBarProfileProvider>
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          tabBarActiveTintColor: TAB_ACTIVE,
          tabBarInactiveTintColor: TAB_INACTIVE,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.2,
          },
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#e5e5ea",
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
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
