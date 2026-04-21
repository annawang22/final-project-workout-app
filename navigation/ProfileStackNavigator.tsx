import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useTheme } from "../context/ThemeContext";
import type { ProfileStackParamList } from "./profileStackTypes";
import LogbookScreen from "../screens/LogbookScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="Logbook"
        component={LogbookScreen}
        options={{
          title: "Logbook",
          headerBackTitle: "Profile",
        }}
      />
    </Stack.Navigator>
  );
}
