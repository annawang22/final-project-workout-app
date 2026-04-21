import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GoalDetailScreen from "../screens/GoalDetailScreen";
import GoalsScreen from "../screens/GoalsScreen";
import type { GoalsStackParamList } from "./goalsStackTypes";

const Stack = createNativeStackNavigator<GoalsStackParamList>();

export default function GoalsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GoalsList"
        component={GoalsScreen}
        options={{
          headerShown: false,
          /** Used as iOS back label on Goal Detail (not the route key `GoalsList`). */
          title: "Goals",
        }}
      />
      <Stack.Screen
        name="GoalDetail"
        component={GoalDetailScreen}
        options={{
          title: "Goal",
          /** iOS back chevron label (parent route is `GoalsList`). */
          headerBackTitle: "Goals",
        }}
      />
    </Stack.Navigator>
  );
}
