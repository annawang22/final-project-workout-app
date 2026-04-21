/**
 * Goals list gesture-conflict rules (Phase 5):
 *
 * 1) Single tap vs double tap:
 *    - Tap #1 starts a short timer (~280ms).
 *    - If tap #2 arrives before timeout, timer is cancelled and we navigate (double tap).
 *    - If no second tap arrives, timer fires and we expand/collapse only that row.
 *
 * 2) Swipe isolation from taps / scroll:
 *    - Full-row swipe uses RNGH Gesture.Pan with activeOffsetX + failOffsetY so horizontal
 *      intent can claim the gesture before FlatList scroll eats the touch.
 *    - onStart marks swipe-consumed so the row Pressable does not treat the sequence as a tap.
 *    - If pan never activates, tap/double-tap/long-press behave as before.
 *
 * 3) Long press edit isolation:
 *    - Long press clears pending single-tap timer to avoid accidental expand/navigation
 *      when the user intended to edit.
 */

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import type { AppColors } from "../context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import type { GoalsStackParamList } from "../navigation/goalsStackTypes";
import {
    addGoal,
    deleteGoal,
    getGoals,
    setGoalActiveOnHome,
    updateGoalText,
} from "../utils/storage";
import {
  CONTENT_BOTTOM,
  SCREEN_HORIZONTAL,
  SPACING,
  typography,
} from "../utils/theme";

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

const SWIPE_MAX = 72;
const COMMIT_AT = SWIPE_MAX * 0.32;
const FLICK_VEL = 420;
const FLICK_MIN_DX = 12;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function createGoalsStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 120,
    },
    listContent: {
      paddingHorizontal: SCREEN_HORIZONTAL,
      paddingTop: SPACING.md,
    },
    emptyWrap: {
      flex: 1,
      paddingHorizontal: SCREEN_HORIZONTAL,
      paddingVertical: SPACING.lg,
      justifyContent: "center",
    },
    emptyText: {
      ...typography.body,
      lineHeight: 24,
      textAlign: "center",
      color: colors.textSecondary,
    },
    rowOuter: {
      marginBottom: 10,
    },
    swipeTrack: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 10,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    swipeTrackActive: {
      backgroundColor: colors.goalSwipeActive,
    },
    swipeTrackInactive: {
      backgroundColor: colors.goalSwipeInactive,
    },
    swipeTrackLabel: {
      fontSize: 12,
      fontWeight: "700",
    },
    swipeTrackLabelActive: {
      color: colors.goalAccent,
      textAlign: "right",
    },
    swipeTrackLabelInactive: {
      color: colors.goalSwipeLabelInactive,
      textAlign: "right",
    },
    rowCard: {
      borderRadius: 10,
    },
    rowMain: {
      backgroundColor: colors.goalRowBg,
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.goalRowBorder,
      borderRadius: 10,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowActive: {
      backgroundColor: colors.goalRowActive,
    },
    rowPressed: {
      backgroundColor: colors.goalRowPressed,
    },
    rowText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    activeBadge: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.goalAccent,
      borderWidth: 1,
      borderColor: colors.goalAccent,
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
      color: colors.textSecondary,
    },
    previewLine: {
      fontSize: 14,
      color: colors.textPrimary,
      marginTop: 4,
    },
    fab: {
      position: "absolute",
      right: SPACING.md + SPACING.xs,
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
    pressed: {
      opacity: 0.7,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalAvoid: {
      width: "100%",
    },
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
    modalLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
      color: colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 80,
      textAlignVertical: "top",
      color: colors.textPrimary,
    },
    errorText: {
      color: colors.danger,
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
      color: colors.link,
    },
    primaryBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    primaryLabel: {
      fontSize: 16,
      color: colors.onInteractive,
      fontWeight: "600",
    },
    dangerBtn: {
      marginTop: 16,
      paddingVertical: 10,
      alignItems: "center",
    },
    dangerLabel: {
      fontSize: 16,
      color: colors.danger,
    },
  });
}

type GoalsStyles = ReturnType<typeof createGoalsStyles>;

function GoalSwipeRow({
  styles,
  goal,
  isExpanded,
  onTap,
  onLongPress,
  onCommit,
}: {
  styles: GoalsStyles;
  goal: Goal;
  isExpanded: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onCommit: (next: boolean) => Promise<void>;
}) {
  const txAnim = useRef(new Animated.Value(0)).current;
  const panningRef = useRef(false);
  const consumedTapRef = useRef(false);
  const activeRef = useRef(goal.isActiveOnHome);
  const pendingRef = useRef(false);
  const exList = Array.isArray(goal.exercises) ? goal.exercises : [];

  useEffect(() => {
    activeRef.current = goal.isActiveOnHome;
  }, [goal.isActiveOnHome]);

  const markSwipeBegan = useCallback(() => {
    consumedTapRef.current = true;
    panningRef.current = true;
  }, []);

  const markSwipeEnded = useCallback(() => {
    panningRef.current = false;
    setTimeout(() => {
      consumedTapRef.current = false;
    }, 280);
  }, []);

  const springCardClosed = useCallback(() => {
    Animated.spring(txAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  }, [txAnim]);

  const tryCommitToggle = useCallback(() => {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    const next = !activeRef.current;
    void Promise.resolve(onCommit(next)).finally(() => {
      pendingRef.current = false;
    });
  }, [onCommit]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-14, 14])
        .failOffsetY([-22, 22])
        .onStart(() => {
          markSwipeBegan();
        })
        .onUpdate((e) => {
          const x = clamp(e.translationX, 0, SWIPE_MAX);
          txAnim.setValue(x);
        })
        .onEnd((e, success) => {
          if (!success) {
            return;
          }
          const at = clamp(e.translationX, 0, SWIPE_MAX);
          const passed =
            at >= COMMIT_AT ||
            (e.velocityX > FLICK_VEL && at >= FLICK_MIN_DX);
          if (passed) {
            tryCommitToggle();
          }
        })
        .onFinalize(() => {
          springCardClosed();
          markSwipeEnded();
        }),
    [
      markSwipeBegan,
      markSwipeEnded,
      springCardClosed,
      tryCommitToggle,
      txAnim,
    ],
  );

  return (
    <View style={styles.rowOuter}>
      <View
        style={[
          styles.swipeTrack,
          goal.isActiveOnHome ? styles.swipeTrackActive : styles.swipeTrackInactive,
        ]}
      >
        <Text
          style={[
            styles.swipeTrackLabel,
            goal.isActiveOnHome
              ? styles.swipeTrackLabelActive
              : styles.swipeTrackLabelInactive,
          ]}
        >
          {goal.isActiveOnHome ? "Active" : "Swipe to activate"}
        </Text>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.rowCard, { transform: [{ translateX: txAnim }] }]}
        >
        <Pressable
          onPress={() => {
            if (consumedTapRef.current) {
              return;
            }
            onTap();
          }}
          onLongPress={() => {
            if (panningRef.current || consumedTapRef.current) {
              return;
            }
            onLongPress();
          }}
          style={({ pressed }) => [
            styles.rowMain,
            goal.isActiveOnHome && styles.rowActive,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.rowTop}>
            <Text style={styles.rowText}>{goal.text}</Text>
            {goal.isActiveOnHome ? <Text style={styles.activeBadge}>Active</Text> : null}
          </View>
          {isExpanded ? (
            <View style={styles.previewBox}>
              {exList.length === 0 ? (
                <Text style={styles.previewHint}>No exercises yet</Text>
              ) : (
                exList.map((raw, idx) => (
                  <Text key={exercisePreviewKey(raw, idx)} style={styles.previewLine}>
                    • {formatExercisePreviewLine(raw)}
                  </Text>
                ))
              )}
            </View>
          ) : null}
        </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function GoalsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createGoalsStyles(colors), [colors]);
  const navigation = useNavigation<GoalsNav>();
  const insets = useSafeAreaInsets();

  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleSwipeCommit = useCallback(
    async (goalId: string, nextActive: boolean) => {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, isActiveOnHome: nextActive } : g,
        ),
      );
      const ok = await setGoalActiveOnHome(goalId, nextActive);
      if (!ok) {
        await loadGoals();
      }
    },
    [loadGoals],
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

  if (!ready) {
    return (
      <View style={styles.screen}>
        <AppHeader title="My Goals" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="My Goals" />
      {goals.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{EMPTY_STATE}</Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: CONTENT_BOTTOM.goalsList + insets.bottom },
          ]}
          renderItem={({ item }) => {
            return (
              <GoalSwipeRow
                styles={styles}
                goal={item}
                isExpanded={expandedGoalIds.has(item.id)}
                onTap={() => handleRowPress(item)}
                onLongPress={() => openEdit(item)}
                onCommit={async (next) => {
                  if (tapTimerRef.current) {
                    clearTimeout(tapTimerRef.current);
                    tapTimerRef.current = null;
                  }
                  await handleSwipeCommit(item.id, next);
                }}
              />
            );
          }}
        />
      )}

      <Pressable
        onPress={openAdd}
        style={({ pressed }) => [
          styles.fab,
          { bottom: SPACING.lg + insets.bottom },
          pressed && styles.pressed,
        ]}
        hitSlop={6}
        accessibilityLabel="Add goal"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

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
                { paddingBottom: SPACING.md + insets.bottom },
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
                placeholderTextColor={colors.placeholder}
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
