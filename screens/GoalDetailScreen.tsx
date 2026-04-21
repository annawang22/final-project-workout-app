import type { RouteProp } from "@react-navigation/native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RepeatConfigModal from "../components/RepeatConfigModal";
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

export default function GoalDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { goalId } = params;
  const insets = useSafeAreaInsets();

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
        <ActivityIndicator size="large" />
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
                    hitSlop={10}
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
            { bottom: 24 + insets.bottom },
            pressed && styles.pressed,
          ]}
          hitSlop={6}
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
                { paddingBottom: 16 + insets.bottom },
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
              />
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="e.g. 10 min"
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: { flex: 1 },
  emptyWrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, textAlign: "center", color: "#333" },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  dragHandle: { padding: 8, marginRight: 4 },
  dragIcon: { fontSize: 20, color: "#666" },
  exMain: { flex: 1 },
  exName: { fontSize: 16, fontWeight: "600" },
  exMeta: { fontSize: 14, color: "#555", marginTop: 2 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "500" },
  pressed: { opacity: 0.7 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalAvoid: { width: "100%" },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  row2: { flexDirection: "row" },
  half: { flex: 1, marginRight: 8 },
  repeatBtn: {
    paddingVertical: 10,
    marginBottom: 2,
  },
  repeatLabel: { color: "#06c", fontSize: 16 },
  repeatSummary: { fontSize: 13, color: "#333", marginBottom: 8 },
  repeatSummaryMuted: { fontSize: 13, color: "#888", marginBottom: 8 },
  errorText: { color: "#c00", marginBottom: 6 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
  },
  link: { color: "#06c", fontSize: 16, marginRight: 20 },
  primaryBtn: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  dangerBtn: { marginTop: 16, alignItems: "center" },
  dangerText: { color: "#c00", fontSize: 16 },
});
