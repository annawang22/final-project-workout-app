import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import GoalsStackNavigator from "./GoalsStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";
import HomeScreen from "../screens/HomeScreen";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Goals"
        component={GoalsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
