/**
 * Goals screen — planned gesture model (Goals list rows, Phase 5+):
 *
 * - Single tap → expand/collapse exercise dropdown
 * - Double tap → navigate to Goal Detail screen
 * - Swipe right → toggle isActiveOnHome
 */

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useLayoutEffect, useState } from "react";
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
  addGoal,
  deleteGoal,
  getGoals,
  updateGoalText,
} from "../utils/storage";

type Goal = {
  id: string;
  text: string;
  exercises: unknown[];
  isActiveOnHome: boolean;
};

const EMPTY_STATE =
  "No goals yet. Create your first workout goal to get started.";

export default function GoalsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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

  const openAdd = useCallback(() => {
    setEditingGoalId(null);
    setInputValue("");
    setSaveError(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((goal: Goal) => {
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
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => openEdit(item)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowText}>{item.text}</Text>
            </Pressable>
          )}
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
  rowPressed: {
    backgroundColor: "#f5f5f5",
  },
  rowText: {
    fontSize: 16,
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
