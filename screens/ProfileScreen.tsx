import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import AppHeader from "../components/AppHeader";
import type { AppColors } from "../context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import type { ProfileStackParamList } from "../navigation/profileStackTypes";
import { navigationRef } from "../navigation/navigationRef";
import { useTabBarProfile } from "../navigation/TabBarProfileContext";
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
import { PROFILE_DARK_MODE_SWITCH, SPACING } from "../utils/theme";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

// DEBUG DATE OVERRIDE TOOL
// Hidden for production. Set SHOW_DEBUG_TOOLS = true to re-enable.
// Used for testing repeat logic without changing device date.
const SHOW_DEBUG_TOOLS = false;

function createProfileStyles(colors: AppColors) {
  return StyleSheet.create({
    screenRoot: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollFlex: {
      flex: 1,
    },
    scroll: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xl + SPACING.md,
    },
    welcome: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: SPACING.lg,
      textAlign: "center",
      color: colors.textPrimary,
    },
    avatarWrap: { alignItems: "center", marginBottom: SPACING.lg },
    avatarImg: {
      width: 112,
      height: 112,
      borderRadius: 56,
      marginBottom: 12,
    },
    avatarPlaceholder: {
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarPlaceholderText: {
      fontSize: 40,
      color: colors.placeholder,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    editLink: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.link,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      fontSize: 16,
      color: colors.textPrimary,
    },
    fieldError: {
      color: colors.danger,
      marginBottom: 8,
      fontSize: 14,
    },
    readonlyValue: {
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    secondaryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.neutralBorderSoft,
      marginBottom: 8,
    },
    secondaryBtnText: { fontSize: 16, color: colors.textPrimary },
    removePhoto: {
      fontSize: 14,
      color: colors.link,
      marginBottom: 8,
    },
    logbookBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 16,
    },
    logbookBtnText: {
      color: colors.onInteractive,
      fontSize: 17,
      fontWeight: "600",
    },
    logoutBtn: {
      alignSelf: "flex-start",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.neutralBorder,
      marginBottom: 32,
    },
    logoutLabel: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    debugSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 20,
    },
    debugHeading: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.debugHeading,
      marginBottom: 10,
    },
    debugLine: { fontSize: 15, marginBottom: 6, color: colors.textPrimary },
    debugSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    debugBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 10,
    },
    debugBtnText: { color: colors.onInteractive, fontWeight: "600" },
    debugBtnSecondary: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.neutralBorder,
    },
    debugBtnSecondaryText: { fontSize: 16, color: colors.textPrimary },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
    },
    modalBackdropInner: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 14,
      color: colors.textPrimary,
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
      color: colors.link,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    modalSave: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    modalSaveText: {
      color: colors.onInteractive,
      fontSize: 16,
      fontWeight: "600",
    },
    primaryBtnDisabled: { opacity: 0.5 },
  });
}

type ProfileStyles = ReturnType<typeof createProfileStyles>;

function DebugDateOverrideSection({
  onChanged,
  styles,
  placeholderColor,
}: {
  onChanged: () => void;
  styles: ProfileStyles;
  placeholderColor: string;
}) {
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
        placeholderTextColor={placeholderColor}
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
  const { colors, isDark, setDarkMode } = useTheme();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);
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
    <View style={styles.screenRoot}>
      <AppHeader title="Profile" />
      <ScrollView
        style={styles.scrollFlex}
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
        <Text
          style={styles.readonlyValue}
          numberOfLines={4}
          ellipsizeMode="tail"
        >
          {usernameLine}
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.fieldLabel}>Dark Mode</Text>
          <Switch
            accessibilityLabel="Dark mode"
            value={isDark}
            onValueChange={(v) => void setDarkMode(v)}
            trackColor={PROFILE_DARK_MODE_SWITCH.trackColor}
            thumbColor={PROFILE_DARK_MODE_SWITCH.thumbColor}
            ios_backgroundColor={PROFILE_DARK_MODE_SWITCH.ios_backgroundColor}
          />
        </View>

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
          <DebugDateOverrideSection
            onChanged={load}
            styles={styles}
            placeholderColor={colors.placeholder}
          />
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
                placeholderTextColor={colors.placeholder}
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
    </View>
  );
}
