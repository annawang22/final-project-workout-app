import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";

import HomeScreen from "./screens/HomeScreen";
import GoalsScreen from "./screens/GoalsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { getUser } from "./utils/storage";

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    void (async () => {
      const user = await getUser();
      console.log("[storage] getUser on launch:", user);
    })();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerTitleAlign: "center" }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
