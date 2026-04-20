/**
 * Goals screen — planned gesture model (Goals list rows, Phase 5+):
 *
 * - Single tap → expand/collapse exercise dropdown
 * - Double tap → navigate to Goal Detail screen
 * - Swipe right → toggle isActiveOnHome
 */

import { StyleSheet, Text, View } from "react-native";

export default function GoalsScreen() {
  return (
    <View style={styles.center}>
      <Text>Goals</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
