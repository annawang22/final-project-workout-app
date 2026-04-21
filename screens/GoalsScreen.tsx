/**
 * Goals list gesture-conflict rules (Phase 5):
 *
 * 1) Single tap vs double tap:
 *    - Tap #1 starts a short timer (~280ms).
 *    - If tap #2 arrives before timeout, timer is cancelled and we navigate (double tap).
 *    - If no second tap arrives, timer fires and we expand/collapse only that row.
 *
 * 2) Swipe isolation from taps:
 *    - We track touch start/end coordinates per row press.
 *    - If horizontal movement crosses the right-swipe threshold (and dominates vertical),
 *      we toggle activation and mark that touch sequence as "swipe consumed".
 *    - Consumed swipe blocks tap handling for that release, so swipe does not trigger
 *      single-tap expansion or double-tap navigation.
 *
 * 3) Long press edit isolation:
 *    - Long press clears pending single-tap timer to avoid accidental expand/navigation
 *      when the user intended to edit.
 */

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  type GestureResponderEvent,
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

import type { GoalsStackParamList } from "../navigation/goalsStackTypes";
import {
  addGoal,
  deleteGoal,
  getGoals,
  toggleGoalActiveOnHome,
  updateGoalText,
} from "../utils/storage";

type Goal = {
  id: string;
  text: string;
  exercises: unknown[];
  isActiveOnHome: boolean;
};

type GoalsNav = NativeStackNavigationProp<GoalsStackParamList, "GoalsList">;

const EMPTY_STATE =
  "No goals yet. Create your first workout goal to get started.";

function coerceNumber(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const n = Number(String(v).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Inline goal-row preview: e.g. `Sprints (8 reps × 30 secs)` */
function formatExercisePreviewLine(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    return "";
  }
  const o = raw as Record<string, unknown>;
  const name = String(o.name ?? "").trim() || "Exercise";
  const parts: string[] = [];
  const sets = coerceNumber(o.sets);
  const reps = coerceNumber(o.reps);
  const weight = coerceNumber(o.weight);
  const duration =
    o.duration != null && String(o.duration).trim() !== ""
      ? String(o.duration).trim()
      : null;
  if (sets != null) {
    parts.push(`${sets} set${sets === 1 ? "" : "s"}`);
  }
  if (reps != null) {
    parts.push(`${reps} rep${reps === 1 ? "" : "s"}`);
  }
  if (weight != null) {
    parts.push(String(weight));
  }
  if (duration) {
    parts.push(duration);
  }
  if (parts.length === 0) {
    return name;
  }
  return `${name} (${parts.join(" × ")})`;
}

function exercisePreviewKey(raw: unknown, index: number): string {
  if (raw && typeof raw === "object" && "id" in raw && raw.id != null) {
    return String(raw.id);
  }
  return `ex-preview-${index}`;
}

export default function GoalsScreen() {
  const navigation = useNavigation<GoalsNav>();
  const insets = useSafeAreaInsets();

  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ goalId: string; x: number; y: number } | null>(null);
  const swipeConsumedRef = useRef<Set<string>>(new Set());
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [goals, setGoals] = useState<Goal[]>([]);
  const [ready, setReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setGoals((await getGoals()) as Goal[]);
    } finally {
      setReady(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadGoals();
    }, [loadGoals]),
  );

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  const handleRowPress = useCallback(
    (goal: Goal) => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
        navigation.navigate("GoalDetail", { goalId: goal.id });
        return;
      }
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        setExpandedGoalIds((prev) => {
          const next = new Set(prev);
          if (next.has(goal.id)) {
            next.delete(goal.id);
          } else {
            next.add(goal.id);
          }
          return next;
        });
      }, 280);
    },
    [navigation],
  );

  const handleRowPressIn = useCallback((goalId: string, e: GestureResponderEvent) => {
    touchStartRef.current = {
      goalId,
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
    };
  }, []);

  const handleSwipeToggle = useCallback(
    async (goalId: string) => {
      let optimistic: boolean | null = null;
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) {
            return g;
          }
          optimistic = !g.isActiveOnHome;
          return { ...g, isActiveOnHome: optimistic };
        }),
      );
      const persisted = await toggleGoalActiveOnHome(goalId);
      if (persisted == null) {
        await loadGoals();
        return;
      }
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, isActiveOnHome: persisted } : g)),
      );
    },
    [loadGoals],
  );

  const handleRowPressOut = useCallback(
    (goalId: string, e: GestureResponderEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || start.goalId !== goalId) {
        return;
      }
      const dx = e.nativeEvent.pageX - start.x;
      const dy = Math.abs(e.nativeEvent.pageY - start.y);
      const isRightSwipe = dx > 48 && dx > dy + 12;
      if (!isRightSwipe) {
        return;
      }
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      swipeConsumedRef.current.add(goalId);
      setTimeout(() => {
        swipeConsumedRef.current.delete(goalId);
      }, 500);
      void handleSwipeToggle(goalId);
    },
    [handleSwipeToggle],
  );

  const openAdd = useCallback(() => {
    setEditingGoalId(null);
    setInputValue("");
    setSaveError(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((goal: Goal) => {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    setEditingGoalId(goal.id);
    setInputValue(goal.text);
    setSaveError(null);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setInputValue("");
    setEditingGoalId(null);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0) {
      setSaveError("Goal text cannot be empty.");
      return;
    }
    setSaveError(null);
    if (editingGoalId) {
      const ok = await updateGoalText(editingGoalId, inputValue);
      if (!ok) {
        setSaveError("Could not update goal.");
        return;
      }
    } else {
      const created = await addGoal(inputValue);
      if (!created) {
        setSaveError("Could not save goal.");
        return;
      }
    }
    setGoals((await getGoals()) as Goal[]);
    setModalVisible(false);
    setInputValue("");
    setEditingGoalId(null);
  }, [editingGoalId, inputValue]);

  const handleDelete = useCallback(async () => {
    if (!editingGoalId) {
      return;
    }
    await deleteGoal(editingGoalId);
    setGoals((await getGoals()) as Goal[]);
    setModalVisible(false);
    setInputValue("");
    setEditingGoalId(null);
    setSaveError(null);
  }, [editingGoalId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.headerBtnText}>+</Text>
        </Pressable>
      ),
    });
  }, [navigation, openAdd]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {goals.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{EMPTY_STATE}</Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const exList = Array.isArray(item.exercises) ? item.exercises : [];
            return (
              <Pressable
                onPress={() => {
                  if (swipeConsumedRef.current.has(item.id)) {
                    swipeConsumedRef.current.delete(item.id);
                    return;
                  }
                  handleRowPress(item);
                }}
                onPressIn={(e) => handleRowPressIn(item.id, e)}
                onPressOut={(e) => handleRowPressOut(item.id, e)}
                onLongPress={() => openEdit(item)}
                style={({ pressed }) => [
                  styles.row,
                  item.isActiveOnHome && styles.rowActive,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowText}>{item.text}</Text>
                  {item.isActiveOnHome ? (
                    <Text style={styles.activeBadge}>Active</Text>
                  ) : null}
                </View>
                {expandedGoalIds.has(item.id) ? (
                  <View style={styles.previewBox}>
                    {exList.length === 0 ? (
                      <Text style={styles.previewHint}>No exercises yet</Text>
                    ) : (
                      exList.map((raw, idx) => (
                        <Text
                          key={exercisePreviewKey(raw, idx)}
                          style={styles.previewLine}
                        >
                          • {formatExercisePreviewLine(raw)}
                        </Text>
                      ))
                    )}
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      <Modal
        visible={modalVisible}
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
                {editingGoalId ? "Edit goal" : "New goal"}
              </Text>
              <Text style={styles.modalLabel}>Goal</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="e.g. Run 3 times per week"
                multiline
                autoFocus
              />
              {saveError ? (
                <Text style={styles.errorText}>{saveError}</Text>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeModal}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleSave()}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryLabel}>Save</Text>
                </Pressable>
              </View>
              {editingGoalId ? (
                <Pressable
                  onPress={() => void handleDelete()}
                  style={({ pressed }) => [
                    styles.dangerBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.dangerLabel}>Delete goal</Text>
                </Pressable>
              ) : null}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  emptyWrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#333",
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowActive: {
    backgroundColor: "#e8f4ff",
  },
  rowPressed: {
    backgroundColor: "#f5f5f5",
  },
  rowText: {
    fontSize: 16,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0a66c2",
    borderWidth: 1,
    borderColor: "#0a66c2",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewBox: {
    marginTop: 10,
    paddingLeft: 4,
  },
  previewHint: {
    fontSize: 14,
    color: "#666",
  },
  previewLine: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  headerBtn: {
    marginRight: 8,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: {
    fontSize: 28,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalAvoid: {
    width: "100%",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#c00",
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  secondaryLabel: {
    fontSize: 16,
    color: "#06c",
  },
  primaryBtn: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  dangerBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  dangerLabel: {
    fontSize: 16,
    color: "#c00",
  },
});
