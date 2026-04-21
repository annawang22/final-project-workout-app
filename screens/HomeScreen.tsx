import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  executeHomeCompletion,
  isAlreadyCompletedForDate,
} from "../utils/homeCompletion";
import {
  type HomeMergedRow,
  formatHomeDateHeader,
  formatHomeExerciseDetails,
  getMergedHomeExerciseRows,
} from "../utils/homeDisplay";
import {
  addHomeStandaloneExercise,
  formatDateYMD,
  getEffectiveToday,
  refreshDebugDateOverrideCache,
} from "../utils/storage";

import AppHeader from "../components/AppHeader";
import type { AppColors } from "../context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import {
  CONTENT_BOTTOM,
  SCREEN_HORIZONTAL,
  SPACING,
  typography,
} from "../utils/theme";

const EMPTY_STATE = "YAY you finished all exercises for the day";

function createHomeStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 120,
    },
    dateText: {
      ...typography.subheader,
      color: colors.textPrimary,
      textAlign: "center",
      paddingHorizontal: SCREEN_HORIZONTAL,
      paddingBottom: SPACING.sm,
    },
    emptyWrap: {
      flex: 1,
      paddingHorizontal: SCREEN_HORIZONTAL,
      justifyContent: "center",
    },
    emptyText: {
      ...typography.body,
      textAlign: "center",
      color: colors.textSecondary,
      lineHeight: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.neutralBorderSoft,
      marginRight: 12,
      marginTop: 2,
    },
    rowBody: { flex: 1 },
    rowTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    rowMeta: { fontSize: 14, color: colors.rowMeta, marginTop: 4 },
    rowHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    rowCompleting: { opacity: 0.45 },
    checkboxHit: { paddingVertical: 4, paddingRight: 4 },
    checkboxDone: {
      borderColor: colors.interactiveStrong,
      backgroundColor: colors.checkboxTrack,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxMark: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.interactiveStrong,
    },
    fab: {
      position: "absolute",
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.interactiveStrong,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
    },
    fabText: {
      color: colors.onInteractive,
      fontSize: 32,
      lineHeight: 36,
      fontWeight: "500",
    },
    pressed: { opacity: 0.75 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalAvoid: { width: "100%" },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      color: colors.textPrimary,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
      color: colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      color: colors.textPrimary,
    },
    row2: { flexDirection: "row" },
    half: { flex: 1, marginRight: 8 },
    errorText: { color: colors.danger, marginBottom: 8 },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 8,
    },
    link: { color: colors.link, fontSize: 16, marginRight: 20 },
    primaryBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    primaryLabel: {
      color: colors.onInteractive,
      fontSize: 16,
      fontWeight: "600",
    },
  });
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [dateHeader, setDateHeader] = useState("");
  const [rows, setRows] = useState<HomeMergedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  /** Rows actively animating to complete (grey + checkmark before persistence). */
  const [completingKeys, setCompletingKeys] = useState<Record<string, boolean>>({});
  const completingGuard = useRef(new Set<string>());

  const loadHome = useCallback(async () => {
    await refreshDebugDateOverrideCache();
    const eff = getEffectiveToday();
    setDateHeader(formatHomeDateHeader(eff));
    const merged = await getMergedHomeExerciseRows(eff);
    setRows(merged);
    setLoading(false);
  }, []);

  const scheduleComplete = useCallback(
    (item: HomeMergedRow) => {
      const key = item.key;
      if (completingGuard.current.has(key)) {
        return;
      }
      completingGuard.current.add(key);

      void (async () => {
        try {
          await refreshDebugDateOverrideCache();
          const effCheck = getEffectiveToday();
          const ymdCheck = formatDateYMD(effCheck);
          if (await isAlreadyCompletedForDate(item, ymdCheck)) {
            completingGuard.current.delete(key);
            return;
          }

          setCompletingKeys((prev) => ({ ...prev, [key]: true }));

          setTimeout(() => {
            void (async () => {
              try {
                await refreshDebugDateOverrideCache();
                const eff = getEffectiveToday();
                const ymd = formatDateYMD(eff);
                if (await isAlreadyCompletedForDate(item, ymd)) {
                  return;
                }
                await executeHomeCompletion(item, eff);
                await loadHome();
              } catch (e) {
                console.error("scheduleComplete", e);
                await loadHome();
              } finally {
                completingGuard.current.delete(key);
                setCompletingKeys((prev) => {
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
              }
            })();
          }, 500);
        } catch (e) {
          console.error("scheduleComplete precheck", e);
          completingGuard.current.delete(key);
        }
      })();
    },
    [loadHome],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadHome();
    }, [loadHome]),
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setDuration("");
    setFormError(null);
  }, []);

  const openModal = useCallback(() => {
    setFormError(null);
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setDuration("");
    setModalOpen(true);
  }, []);

  const saveStandalone = useCallback(async () => {
    const n = name.trim();
    if (n.length === 0) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    const created = await addHomeStandaloneExercise({
      name: n,
      sets,
      reps,
      weight,
      duration,
    });
    if (!created) {
      setFormError("Could not save exercise.");
      return;
    }
    closeModal();
    await loadHome();
  }, [closeModal, duration, loadHome, name, reps, sets, weight]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <AppHeader title="Home" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Home" />
      <Text style={[styles.dateText, { paddingTop: SPACING.sm + SPACING.xs }]}>
        {dateHeader}
      </Text>

      {rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{EMPTY_STATE}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          extraData={completingKeys}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_HORIZONTAL,
            paddingTop: SPACING.sm + SPACING.xs,
            paddingBottom: CONTENT_BOTTOM.homeList + insets.bottom,
          }}
          renderItem={({ item }) => {
            const ex = item.exercise;
            const detail = formatHomeExerciseDetails(ex);
            const isCompleting = !!completingKeys[item.key];
            return (
              <View
                style={[styles.row, isCompleting && styles.rowCompleting]}
              >
                <Pressable
                  onPress={() => scheduleComplete(item)}
                  hitSlop={8}
                  style={styles.checkboxHit}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isCompleting }}
                >
                  <View
                    style={[styles.checkbox, isCompleting && styles.checkboxDone]}
                  >
                    {isCompleting ? (
                      <Text style={styles.checkboxMark}>✓</Text>
                    ) : null}
                  </View>
                </Pressable>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{ex.name}</Text>
                  {detail !== "" ? (
                    <Text style={styles.rowMeta}>{detail}</Text>
                  ) : null}
                  {item.source === "goal" ? (
                    <Text style={styles.rowHint}>{item.goalText}</Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      <Pressable
        onPress={openModal}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: SPACING.lg + insets.bottom,
            right: SPACING.md + SPACING.xs,
          },
          pressed && styles.pressed,
        ]}
        hitSlop={6}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalAvoid}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.modalCard,
                { paddingBottom: SPACING.md + insets.bottom },
              ]}
            >
              <Text style={styles.modalTitle}>Add exercise</Text>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Exercise name"
                placeholderTextColor={colors.placeholder}
              />
              <View style={styles.row2}>
                <View style={styles.half}>
                  <Text style={styles.label}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>
              <Text style={styles.label}>Weight</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.placeholder}
              />
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="e.g. 10 min"
                placeholderTextColor={colors.placeholder}
              />
              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable onPress={closeModal}>
                  <Text style={styles.link}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void saveStandalone()}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryLabel}>Add</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}
