import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useTheme } from "../context/ThemeContext";
import GoalDetailScreen from "../screens/GoalDetailScreen";
import GoalsScreen from "../screens/GoalsScreen";
import type { GoalsStackParamList } from "./goalsStackTypes";

const Stack = createNativeStackNavigator<GoalsStackParamList>();

export default function GoalsStackNavigator() {
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
        name="GoalsList"
        component={GoalsScreen}
        options={{
          headerShown: false,
          title: "Goals",
        }}
      />
      <Stack.Screen
        name="GoalDetail"
        component={GoalDetailScreen}
        options={{
          title: "Goal",
          headerBackTitle: "Goals",
        }}
      />
    </Stack.Navigator>
  );
}
