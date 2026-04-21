import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ProfileStackParamList } from "../navigation/profileStackTypes";
import { navigationRef } from "../navigation/navigationRef";
import {
  clearDebugDateOverride,
  formatDateYMD,
  getActiveUser,
  getDebugDateOverrideCached,
  getEffectiveToday,
  getProfile,
  logout,
  refreshDebugDateOverrideCache,
  saveProfile,
  setDebugDateOverride,
} from "../utils/storage";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

/**
 * DEBUG ONLY — this block exists so you can test repeat scheduling (Phase 4+)
 * against a fixed calendar day without changing the device date.
 * Remove before production if desired.
 */
export default function ProfileScreen({ navigation }: Props) {
  const [overrideInput, setOverrideInput] = useState("");
  const [, bump] = useState(0);
  const [nameInput, setNameInput] = useState("Your Name");
  const [nameError, setNameError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    void (async () => {
      await refreshDebugDateOverrideCache();
      const active = await getActiveUser();
      const p = await getProfile();
      if (p) {
        setNameInput(p.name);
        setUsername(p.username);
        setImageUri(p.profileImage);
      } else {
        setNameInput("Your Name");
        setUsername(active);
        setImageUri(null);
      }
      bump((n) => n + 1);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
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

  async function handleSaveName() {
    const t = nameInput.trim();
    if (t.length === 0) {
      setNameError("Name cannot be empty.");
      return;
    }
    setNameError(null);
    setSaving(true);
    const ok = await saveProfile({ name: t });
    setSaving(false);
    if (ok) {
      return;
    }
    setNameError("Could not save. Try again.");
  }

  async function pickProfileImage() {
    setNameError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (res.canceled || !res.assets?.[0]) {
      return;
    }
    const uri = res.assets[0].uri;
    setSaving(true);
    const ok = await saveProfile({ profileImage: uri });
    setSaving(false);
    if (ok) {
      setImageUri(uri);
    }
  }

  async function clearProfileImage() {
    setSaving(true);
    const ok = await saveProfile({ profileImage: null });
    setSaving(false);
    if (ok) {
      setImageUri(null);
    }
  }

  async function handleSetOverride() {
    const v = overrideInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return;
    }
    await setDebugDateOverride(v);
    setOverrideInput("");
    load();
  }

  async function handleClearOverride() {
    await clearDebugDateOverride();
    load();
  }

  const welcomeUser = username ?? "(signed in)";
  const effective = formatDateYMD(getEffectiveToday());
  const cached = getDebugDateOverrideCached();

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.welcome}>Welcome {welcomeUser}</Text>

      <View style={styles.avatarWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.avatarImg}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>?</Text>
          </View>
        )}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void pickProfileImage()}
          disabled={saving}
        >
          <Text style={styles.secondaryBtnText}>Choose profile picture</Text>
        </Pressable>
        {imageUri ? (
          <Pressable onPress={() => void clearProfileImage()} disabled={saving}>
            <Text style={styles.removePhoto}>Remove photo</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.fieldLabel}>Name</Text>
      <TextInput
        style={styles.input}
        value={nameInput}
        onChangeText={(t) => {
          setNameInput(t);
          setNameError(null);
        }}
        placeholder="Your Name"
        editable={!saving}
      />
      {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
      <Pressable
        style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
        onPress={() => void handleSaveName()}
        disabled={saving}
      >
        <Text style={styles.primaryBtnText}>Save name</Text>
      </Pressable>

      <Text style={styles.fieldLabel}>Username</Text>
      <Text style={styles.readonlyValue}>{welcomeUser}</Text>

      <Pressable
        style={styles.logbookBtn}
        onPress={() => navigation.navigate("Logbook")}
      >
        <Text style={styles.logbookBtnText}>Logbook</Text>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
        <Text style={styles.logoutLabel}>Log out</Text>
      </Pressable>

      {/* DEBUG ONLY: lets QA set a fake “today” for repeat rules without changing OS date. */}
      <View style={styles.debugSection}>
        <Text style={styles.debugHeading}>DEBUG (TEMPORARY)</Text>
        <Text style={styles.debugLine}>Current App Date: {effective}</Text>
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
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  avatarWrap: { alignItems: "center", marginBottom: 24 },
  avatarImg: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#e8e8e8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: { fontSize: 40, color: "#999" },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  fieldError: { color: "#c00", marginBottom: 8, fontSize: 14 },
  readonlyValue: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  primaryBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 24,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 8,
  },
  secondaryBtnText: { fontSize: 16 },
  removePhoto: {
    fontSize: 14,
    color: "#06c",
    marginBottom: 8,
  },
  logbookBtn: {
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  logbookBtnText: { color: "#fff", fontSize: 17, fontWeight: "600" },
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
