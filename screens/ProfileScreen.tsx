import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTabBarProfile } from "../navigation/TabBarProfileContext";
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

// DEBUG DATE OVERRIDE TOOL
// Hidden for production. Set SHOW_DEBUG_TOOLS = true to re-enable.
// Used for testing repeat logic without changing device date.
const SHOW_DEBUG_TOOLS = false;

function DebugDateOverrideSection({ onChanged }: { onChanged: () => void }) {
  const [overrideInput, setOverrideInput] = useState("");

  async function handleSetOverride() {
    const v = overrideInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return;
    }
    await setDebugDateOverride(v);
    setOverrideInput("");
    onChanged();
  }

  async function handleClearOverride() {
    await clearDebugDateOverride();
    onChanged();
  }

  const effective = formatDateYMD(getEffectiveToday());
  const cached = getDebugDateOverrideCached();

  return (
    <View style={styles.debugSection}>
      <Text style={styles.debugHeading}>DEBUG (INTERNAL)</Text>
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
      <Pressable style={styles.debugBtn} onPress={() => void handleSetOverride()}>
        <Text style={styles.debugBtnText}>Set override date</Text>
      </Pressable>
      <Pressable
        style={styles.debugBtnSecondary}
        onPress={() => void handleClearOverride()}
      >
        <Text style={styles.debugBtnSecondaryText}>Clear override</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { refreshProfileTabIcon } = useTabBarProfile();

  /** Display name shown in Welcome + Name row (editable via modal). */
  const [displayName, setDisplayName] = useState("Your Name");
  const [username, setUsername] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [modalNameError, setModalNameError] = useState<string | null>(null);

  const load = useCallback(() => {
    void (async () => {
      await refreshDebugDateOverrideCache();
      const active = await getActiveUser();
      const p = await getProfile();
      if (p) {
        setDisplayName(p.name);
        setUsername(p.username);
        setImageUri(p.profileImage);
      } else {
        setDisplayName("Your Name");
        setUsername(active);
        setImageUri(null);
      }
      await refreshProfileTabIcon();
    })();
  }, [refreshProfileTabIcon]);

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

  function openNameModal() {
    setDraftName(displayName);
    setModalNameError(null);
    setNameModalOpen(true);
  }

  function closeNameModal() {
    setNameModalOpen(false);
    setModalNameError(null);
  }

  async function confirmNameModal() {
    const t = draftName.trim();
    if (t.length === 0) {
      setModalNameError("Name cannot be empty.");
      return;
    }
    setModalNameError(null);
    setSaving(true);
    const ok = await saveProfile({ name: t });
    setSaving(false);
    if (ok) {
      setDisplayName(t);
      closeNameModal();
      return;
    }
    setModalNameError("Could not save. Try again.");
  }

  async function pickProfileImage() {
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
      await refreshProfileTabIcon();
    }
  }

  async function clearProfileImage() {
    setSaving(true);
    const ok = await saveProfile({ profileImage: null });
    setSaving(false);
    if (ok) {
      setImageUri(null);
      await refreshProfileTabIcon();
    }
  }

  const usernameLine = username ?? "(signed in)";

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.welcome}>Welcome {displayName}</Text>

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

        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>Name</Text>
          <Pressable onPress={openNameModal} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
        <Text style={styles.readonlyValue}>{displayName}</Text>

        <Text style={styles.fieldLabel}>Username</Text>
        <Text style={styles.readonlyValue}>{usernameLine}</Text>

        <Pressable
          style={styles.logbookBtn}
          onPress={() => navigation.navigate("Logbook")}
        >
          <Text style={styles.logbookBtnText}>Logbook</Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>

        {SHOW_DEBUG_TOOLS ? (
          <DebugDateOverrideSection onChanged={load} />
        ) : null}
      </ScrollView>

      <Modal
        visible={nameModalOpen}
        animationType="fade"
        transparent
        onRequestClose={closeNameModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalBackdropInner} onPress={closeNameModal}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.modalCard}
            >
              <Text style={styles.modalTitle}>Edit name</Text>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={(t) => {
                  setDraftName(t);
                  setModalNameError(null);
                }}
                placeholder="Your Name"
                autoFocus
                editable={!saving}
              />
              {modalNameError ? (
                <Text style={styles.fieldError}>{modalNameError}</Text>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable onPress={closeNameModal} disabled={saving}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSave, saving && styles.primaryBtnDisabled]}
                  onPress={() => void confirmNameModal()}
                  disabled={saving}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  editLink: {
    fontSize: 15,
    fontWeight: "600",
    color: "#06c",
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalBackdropInner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  modalCancel: {
    fontSize: 16,
    color: "#06c",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalSave: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  primaryBtnDisabled: { opacity: 0.5 },
});
