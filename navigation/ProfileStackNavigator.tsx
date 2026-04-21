import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { ProfileStackParamList } from "./profileStackTypes";
import LogbookScreen from "../screens/LogbookScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Logbook"
        component={LogbookScreen}
        options={{ title: "Logbook" }}
      />
    </Stack.Navigator>
  );
}
