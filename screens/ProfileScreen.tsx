import { Pressable, StyleSheet, Text, View } from "react-native";

import { navigationRef } from "../navigation/navigationRef";
import { logout } from "../utils/storage";

export default function ProfileScreen() {
  async function handleLogout() {
    await logout();
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }

  return (
    <View style={styles.center}>
      <Text>Profile</Text>
      <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
        <Text style={styles.logoutLabel}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  logoutBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#888",
  },
  logoutLabel: {
    fontSize: 16,
  },
});
