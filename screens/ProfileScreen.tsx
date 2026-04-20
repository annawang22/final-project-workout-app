import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { navigationRef } from "../navigation/navigationRef";
import {
  clearDebugDateOverride,
  formatDateYMD,
  getActiveUser,
  getDebugDateOverrideCached,
  getEffectiveToday,
  logout,
  refreshDebugDateOverrideCache,
  setDebugDateOverride,
} from "../utils/storage";

/**
 * DEBUG ONLY — this block exists so you can test repeat scheduling (Phase 4+)
 * against a fixed calendar day without changing the device date.
 * Remove before production if desired.
 */
export default function ProfileScreen() {
  const [overrideInput, setOverrideInput] = useState("");
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [, bump] = useState(0);

  const refresh = useCallback(() => {
    void (async () => {
      const u = await getActiveUser();
      setActiveUsername(u);
      await refreshDebugDateOverrideCache();
      bump((n) => n + 1);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleLogout() {
    await logout();
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }

  async function handleSetOverride() {
    const v = overrideInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return;
    }
    await setDebugDateOverride(v);
    setOverrideInput("");
    refresh();
  }

  async function handleClearOverride() {
    await clearDebugDateOverride();
    refresh();
  }

  const effective = formatDateYMD(getEffectiveToday());
  const cached = getDebugDateOverrideCached();

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Profile</Text>
      {activeUsername ? (
        <Text style={styles.profileLine}>Signed in as {activeUsername}</Text>
      ) : (
        <Text style={styles.profileLineMuted}>Not signed in</Text>
      )}
      <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
        <Text style={styles.logoutLabel}>Log out</Text>
      </Pressable>

      {/* DEBUG ONLY: lets QA set a fake “today” for repeat rules without changing OS date. */}
      <View style={styles.debugSection}>
        <Text style={styles.debugHeading}>DEBUG (TEMPORARY)</Text>
        <Text style={styles.debugLine}>
          Current App Date: {effective}
        </Text>
        <Text style={styles.debugSub}>
          Override stored: {cached ?? "(none — using real calendar)"}
        </Text>
        <TextInput
          style={styles.input}
          value={overrideInput}
          onChangeText={setOverrideInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />
        <Pressable
          style={styles.debugBtn}
          onPress={() => void handleSetOverride()}
        >
          <Text style={styles.debugBtnText}>Set override date</Text>
        </Pressable>
        <Pressable
          style={styles.debugBtnSecondary}
          onPress={() => void handleClearOverride()}
        >
          <Text style={styles.debugBtnSecondaryText}>Clear override</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  profileLine: { fontSize: 15, marginBottom: 6 },
  profileLineMuted: { fontSize: 15, color: "#666", marginBottom: 6 },
  logoutBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#888",
    marginBottom: 32,
  },
  logoutLabel: {
    fontSize: 16,
  },
  debugSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    paddingTop: 20,
  },
  debugHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#a60",
    marginBottom: 10,
  },
  debugLine: { fontSize: 15, marginBottom: 6 },
  debugSub: { fontSize: 13, color: "#555", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  debugBtn: {
    backgroundColor: "#333",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  debugBtnText: { color: "#fff", fontWeight: "600" },
  debugBtnSecondary: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#888",
  },
  debugBtnSecondaryText: { fontSize: 16 },
});
