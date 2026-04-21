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
  type TextStyle,
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
import {
  PROFILE_DARK_MODE_SWITCH,
  SCREEN_HORIZONTAL,
  SPACING,
  typography,
} from "../utils/theme";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

// DEBUG DATE OVERRIDE TOOL
// Hidden for production. Set SHOW_DEBUG_TOOLS = true to re-enable.
// Used for testing repeat logic without changing device date.
const SHOW_DEBUG_TOOLS = false;

function createProfileStyles(colors: AppColors) {
  const avatarSize = SPACING.xl * 3 + SPACING.md;
  return StyleSheet.create({
    screenRoot: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollFlex: {
      flex: 1,
    },
    scroll: {
      paddingHorizontal: SCREEN_HORIZONTAL,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xl + SPACING.md,
    },
    welcomeLine: {
      marginBottom: SPACING.lg,
      textAlign: "center",
    },
    welcomePrefix: {
      ...(typography.subheader as TextStyle),
      fontWeight: "500",
      color: colors.textSecondary,
    },
    welcomeName: {
      ...(typography.display as TextStyle),
      color: colors.textPrimary,
    },
    avatarWrap: { alignItems: "center", marginBottom: SPACING.lg },
    avatarImg: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      marginBottom: SPACING.md,
    },
    avatarPlaceholder: {
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarPlaceholderText: {
      fontSize: SPACING.lg + SPACING.lg,
      color: colors.placeholder,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.sm,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    fieldLabel: {
      ...(typography.label as TextStyle),
      color: colors.textPrimary,
    },
    editLink: {
      ...(typography.caption as TextStyle),
      fontWeight: "600",
      color: colors.link,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: SPACING.sm,
      padding: SPACING.md - SPACING.xs,
      marginBottom: SPACING.sm,
      ...(typography.body as TextStyle),
      color: colors.textPrimary,
    },
    fieldError: {
      color: colors.danger,
      marginBottom: SPACING.sm,
      ...(typography.caption as TextStyle),
    },
    readonlyValue: {
      ...(typography.body as TextStyle),
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    readonlyUsername: {
      color: colors.textSecondary,
    },
    secondaryBtn: {
      paddingVertical: SPACING.sm + SPACING.xs,
      paddingHorizontal: SPACING.md,
      borderRadius: SPACING.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.neutralBorderSoft,
      marginBottom: SPACING.sm,
    },
    secondaryBtnText: {
      ...(typography.body as TextStyle),
      color: colors.textPrimary,
    },
    removePhoto: {
      ...(typography.caption as TextStyle),
      color: colors.link,
      marginBottom: SPACING.sm,
    },
    primaryActions: {
      width: "100%",
      gap: SPACING.md,
      marginTop: SPACING.sm,
      marginBottom: SPACING.xl,
    },
    logbookBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: SPACING.md - SPACING.xs,
      borderRadius: SPACING.sm,
      alignItems: "center",
    },
    logbookBtnText: {
      color: colors.onInteractive,
      ...(typography.body as TextStyle),
      fontWeight: "600",
    },
    logoutBtn: {
      alignSelf: "stretch",
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md - SPACING.xs,
      borderRadius: SPACING.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.neutralBorder,
      alignItems: "center",
    },
    logoutLabel: {
      ...(typography.body as TextStyle),
      color: colors.textPrimary,
    },
    debugSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: SPACING.md + SPACING.xs,
    },
    debugHeading: {
      ...(typography.label as TextStyle),
      fontWeight: "800",
      color: colors.debugHeading,
      marginBottom: SPACING.sm + SPACING.xs,
    },
    debugLine: {
      ...(typography.body as TextStyle),
      marginBottom: SPACING.sm,
      color: colors.textPrimary,
    },
    debugSub: {
      ...(typography.caption as TextStyle),
      color: colors.textSecondary,
      marginBottom: SPACING.md,
    },
    debugBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: SPACING.md - SPACING.xs,
      borderRadius: SPACING.sm,
      alignItems: "center",
      marginBottom: SPACING.sm + SPACING.xs,
    },
    debugBtnText: {
      color: colors.onInteractive,
      ...(typography.label as TextStyle),
    },
    debugBtnSecondary: {
      paddingVertical: SPACING.md - SPACING.xs,
      borderRadius: SPACING.sm,
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.neutralBorder,
    },
    debugBtnSecondaryText: {
      ...(typography.body as TextStyle),
      color: colors.textPrimary,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
    },
    modalBackdropInner: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: SPACING.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: SPACING.sm + SPACING.xs,
      padding: SPACING.lg,
    },
    modalTitle: {
      ...(typography.modalTitle as TextStyle),
      marginBottom: SPACING.md - SPACING.xs,
      color: colors.textPrimary,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: SPACING.md,
      marginTop: SPACING.sm,
    },
    modalCancel: {
      ...(typography.body as TextStyle),
      color: colors.link,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
    },
    modalSave: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: SPACING.sm + SPACING.xs,
      paddingHorizontal: SPACING.lg,
      borderRadius: SPACING.sm,
    },
    modalSaveText: {
      color: colors.onInteractive,
      ...(typography.body as TextStyle),
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
        <Text style={styles.welcomeLine} accessibilityRole="header">
          <Text style={styles.welcomePrefix}>Welcome </Text>
          <Text style={styles.welcomeName}>{displayName}</Text>
        </Text>

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
          <Pressable onPress={openNameModal} hitSlop={SPACING.sm}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
        <Text style={styles.readonlyValue}>{displayName}</Text>

        <Text style={styles.fieldLabel}>Username</Text>
        <Text
          style={[styles.readonlyValue, styles.readonlyUsername]}
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

        <View style={styles.primaryActions}>
          <Pressable
            style={styles.logbookBtn}
            onPress={() => navigation.navigate("Logbook")}
          >
            <Text style={styles.logbookBtnText}>Logbook</Text>
          </Pressable>

          <Pressable
            style={styles.logoutBtn}
            onPress={() => void handleLogout()}
          >
            <Text style={styles.logoutLabel}>Log out</Text>
          </Pressable>
        </View>

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
