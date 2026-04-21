import type { RouteProp } from "@react-navigation/native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RepeatConfigModal from "../components/RepeatConfigModal";
import type { AppColors } from "../context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import type { GoalsStackParamList } from "../navigation/goalsStackTypes";
import type { RepeatConfig } from "../types/repeat";
import {
    addExerciseToGoal,
    deleteExerciseFromGoal,
    getGoalById,
    reorderExercisesInGoal,
    sanitizeRepeatConfig,
    updateExerciseInGoal,
} from "../utils/storage";
import {
  CONTENT_BOTTOM,
  SCREEN_HORIZONTAL,
  SPACING,
  typography,
} from "../utils/theme";

export type Exercise = {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration: string | null;
  repeat: RepeatConfig | null;
};

type Nav = NativeStackNavigationProp<GoalsStackParamList, "GoalDetail">;
type R = RouteProp<GoalsStackParamList, "GoalDetail">;

const EMPTY = "Click to add exercise";

function formatRepeatSummary(r: RepeatConfig): string {
  const bits: string[] = [`Every ${r.interval} ${r.frequency}`];
  if (r.frequency === "week" && r.daysOfWeek.length > 0) {
    bits.push(r.daysOfWeek.map((d) => d.slice(0, 3)).join(", "));
  }
  if (r.endType === "date" && r.endDate) {
    bits.push(`ends ${r.endDate}`);
  }
  return bits.join(" · ");
}

function formatExerciseSummary(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.sets != null) {
    parts.push(`${ex.sets} sets`);
  }
  if (ex.reps != null) {
    parts.push(`${ex.reps} reps`);
  }
  if (ex.weight != null) {
    parts.push(`${ex.weight}`);
  }
  if (ex.duration) {
    parts.push(ex.duration);
  }
  if (ex.repeat) {
    parts.push(formatRepeatSummary(ex.repeat));
  }
  return parts.join(" · ");
}

function createDetailStyles(colors: AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    listContainer: { flex: 1 },
    listContent: {
      paddingHorizontal: SCREEN_HORIZONTAL,
      paddingTop: SPACING.sm,
    },
    emptyWrap: {
      flex: 1,
      paddingHorizontal: SCREEN_HORIZONTAL,
      paddingVertical: SPACING.lg,
      justifyContent: "center",
    },
    emptyText: {
      ...(typography.body as TextStyle),
      textAlign: "center",
      color: colors.textSecondary,
    },
    exRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.md,
      paddingHorizontal: 0,
      backgroundColor: colors.background,
    },
    dragHandle: {
      padding: SPACING.sm,
      marginRight: SPACING.xs,
    },
    dragIcon: {
      ...(typography.subheader as TextStyle),
      color: colors.textSecondary,
    },
    exMain: { flex: 1, minWidth: 0 },
    exName: {
      ...(typography.subheader as TextStyle),
      color: colors.textPrimary,
    },
    exMeta: {
      ...(typography.body as TextStyle),
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    fab: {
      position: "absolute",
      right: SPACING.md + SPACING.xs,
      width: SPACING.xl + SPACING.lg,
      height: SPACING.xl + SPACING.lg,
      borderRadius: (SPACING.xl + SPACING.lg) / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: SPACING.xs,
    },
    fabText: {
      color: colors.onPrimary,
      fontSize: 32,
      lineHeight: 36,
      fontWeight: "500",
    },
    pressed: { opacity: 0.7 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalAvoid: { width: "100%" },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: SPACING.sm + SPACING.xs,
      borderTopRightRadius: SPACING.sm + SPACING.xs,
      padding: SPACING.lg,
    },
    modalTitle: {
      ...(typography.modalTitle as TextStyle),
      marginBottom: SPACING.md,
      color: colors.textPrimary,
    },
    label: {
      ...(typography.label as TextStyle),
      marginBottom: SPACING.xs,
      color: colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: SPACING.sm,
      paddingHorizontal: SPACING.md - SPACING.xs,
      paddingVertical: SPACING.sm + SPACING.xs,
      marginBottom: SPACING.sm + SPACING.xs,
      ...(typography.body as TextStyle),
      color: colors.textPrimary,
    },
    row2: { flexDirection: "row" },
    half: { flex: 1, marginRight: SPACING.sm },
    repeatBtn: {
      paddingVertical: SPACING.sm + SPACING.xs,
      marginBottom: SPACING.xs,
    },
    repeatLabel: {
      color: colors.link,
      ...(typography.body as TextStyle),
    },
    repeatSummary: {
      ...(typography.caption as TextStyle),
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    repeatSummaryMuted: {
      ...(typography.caption as TextStyle),
      color: colors.textMuted,
      marginBottom: SPACING.sm,
    },
    errorText: {
      color: colors.danger,
      marginBottom: SPACING.sm,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: SPACING.sm,
    },
    link: {
      color: colors.link,
      ...(typography.body as TextStyle),
      marginRight: SPACING.lg,
    },
    primaryBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: SPACING.sm + SPACING.xs,
      paddingHorizontal: SPACING.lg,
      borderRadius: SPACING.sm,
    },
    primaryLabel: {
      color: colors.onInteractive,
      ...(typography.body as TextStyle),
      fontWeight: "600",
    },
    dangerBtn: {
      marginTop: SPACING.md,
      alignItems: "center",
    },
    dangerText: {
      color: colors.danger,
      ...(typography.body as TextStyle),
    },
  });
}

export default function GoalDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { goalId } = params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const listBottomPad = CONTENT_BOTTOM.goalDetailList + insets.bottom;
  const styles = useMemo(() => createDetailStyles(colors), [colors]);

  const [ready, setReady] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [exerciseRepeat, setExerciseRepeat] = useState<RepeatConfig | null>(
    null,
  );
  const [repeatModalOpen, setRepeatModalOpen] = useState(false);

  const reload = useCallback(async () => {
    const g = await getGoalById(goalId);
    if (!g || typeof g !== "object") {
      navigation.goBack();
      return;
    }
    const row = g as { text?: unknown; exercises?: unknown };
    setGoalTitle(row.text != null ? String(row.text) : "");
    const ex = row.exercises;
    setExercises((Array.isArray(ex) ? ex : []) as Exercise[]);
    setReady(true);
  }, [goalId, navigation]);

  useFocusEffect(
    useCallback(() => {
      setReady(false);
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (!ready) {
      return;
    }
    navigation.setOptions({ title: goalTitle || "Goal" });
  }, [ready, goalTitle, navigation]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setDuration("");
    setFormError(null);
    setExerciseRepeat(null);
    setRepeatModalOpen(false);
  }, []);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setDuration("");
    setFormError(null);
    setExerciseRepeat(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((ex: Exercise) => {
    setEditingId(ex.id);
    setName(ex.name);
    setSets(ex.sets != null ? String(ex.sets) : "");
    setReps(ex.reps != null ? String(ex.reps) : "");
    setWeight(ex.weight != null ? String(ex.weight) : "");
    setDuration(ex.duration ?? "");
    setFormError(null);
    setExerciseRepeat(sanitizeRepeatConfig(ex.repeat) as RepeatConfig | null);
    setModalOpen(true);
  }, []);

  const saveExercise = useCallback(async () => {
    const n = name.trim();
    if (n.length === 0) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    const fields = {
      name: n,
      sets,
      reps,
      weight,
      duration,
      repeat: exerciseRepeat,
    };
    if (editingId) {
      const ok = await updateExerciseInGoal(goalId, editingId, fields);
      if (!ok) {
        setFormError("Could not update exercise.");
        return;
      }
    } else {
      const created = await addExerciseToGoal(goalId, fields);
      if (!created) {
        setFormError("Could not add exercise.");
        return;
      }
    }
    closeModal();
    await reload();
  }, [
    closeModal,
    duration,
    editingId,
    exerciseRepeat,
    goalId,
    name,
    reps,
    sets,
    weight,
    reload,
  ]);

  const removeExercise = useCallback(async () => {
    if (!editingId) {
      return;
    }
    await deleteExerciseFromGoal(goalId, editingId);
    closeModal();
    await reload();
  }, [closeModal, editingId, goalId, reload]);

  const onDragEnd = useCallback(
    async ({ data }: { data: Exercise[] }) => {
      setExercises(data);
      await reorderExercisesInGoal(goalId, data);
    },
    [goalId],
  );

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <View style={styles.flex}>
        {exercises.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{EMPTY}</Text>
          </View>
        ) : (
          <DraggableFlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            onDragEnd={onDragEnd}
            containerStyle={styles.listContainer}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: listBottomPad },
            ]}
            renderItem={({ item, drag, isActive }) => (
              <ScaleDecorator>
                <View
                  style={[
                    styles.exRow,
                    isActive && { opacity: 0.9 },
                  ]}
                >
                  <Pressable
                    onLongPress={drag}
                    style={styles.dragHandle}
                    hitSlop={SPACING.sm}
                    accessibilityLabel="Drag to reorder"
                  >
                    <Text style={styles.dragIcon}>≡</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openEdit(item)}
                    style={styles.exMain}
                  >
                    <Text style={styles.exName}>{item.name}</Text>
                    {formatExerciseSummary(item) !== "" ? (
                      <Text style={styles.exMeta}>
                        {formatExerciseSummary(item)}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              </ScaleDecorator>
            )}
          />
        )}

        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [
            styles.fab,
            { bottom: SPACING.lg + insets.bottom },
            pressed && styles.pressed,
          ]}
          hitSlop={SPACING.sm}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalOpen && !repeatModalOpen}
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
              <Text style={styles.modalTitle}>
                {editingId ? "Edit exercise" : "Add exercise"}
              </Text>
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
              <Pressable
                style={({ pressed }) => [styles.repeatBtn, pressed && styles.pressed]}
                onPress={() => setRepeatModalOpen(true)}
              >
                <Text style={styles.repeatLabel}>Repeat</Text>
              </Pressable>
              {exerciseRepeat ? (
                <Text style={styles.repeatSummary}>
                  {formatRepeatSummary(exerciseRepeat)}
                </Text>
              ) : (
                <Text style={styles.repeatSummaryMuted}>No repeat</Text>
              )}
              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeModal}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text style={styles.link}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void saveExercise()}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryLabel}>
                    {editingId ? "Save" : "Add"}
                  </Text>
                </Pressable>
              </View>
              {editingId ? (
                <Pressable
                  onPress={() => void removeExercise()}
                  style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.dangerText}>Delete exercise</Text>
                </Pressable>
              ) : null}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <RepeatConfigModal
        visible={repeatModalOpen}
        initialRepeat={exerciseRepeat}
        onCancel={() => setRepeatModalOpen(false)}
        onApply={(r) => {
          setExerciseRepeat(r);
          setRepeatModalOpen(false);
        }}
      />
    </GestureHandlerRootView>
  );
}
