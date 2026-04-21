import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
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
  type HomeMergedRow,
  formatHomeDateHeader,
  formatHomeExerciseDetails,
  getMergedHomeExerciseRows,
} from "../utils/homeDisplay";
import {
  addHomeStandaloneExercise,
  getEffectiveToday,
  refreshDebugDateOverrideCache,
} from "../utils/storage";

const EMPTY_STATE = "YAY you finished all exercises for the day";

export default function HomeScreen() {
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

  const loadHome = useCallback(async () => {
    await refreshDebugDateOverrideCache();
    const eff = getEffectiveToday();
    setDateHeader(formatHomeDateHeader(eff));
    const merged = await getMergedHomeExerciseRows(eff);
    setRows(merged);
    setLoading(false);
  }, []);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={[styles.dateText, { paddingTop: 8 + insets.top }]}>
        {dateHeader}
      </Text>

      {rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{EMPTY_STATE}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 100 + insets.bottom,
          }}
          renderItem={({ item }) => {
            const ex = item.exercise;
            const detail = formatHomeExerciseDetails(ex);
            return (
              <View style={styles.row}>
                <View style={styles.checkbox} accessibilityLabel="Exercise (completion in a later phase)" />
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
          { bottom: 24 + insets.bottom, right: 20 },
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
                { paddingBottom: 16 + insets.bottom },
              ]}
            >
              <Text style={styles.modalTitle}>Add exercise</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
    lineHeight: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#444",
    marginRight: 12,
    marginTop: 2,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowMeta: { fontSize: 14, color: "#555", marginTop: 4 },
  rowHint: { fontSize: 12, color: "#888", marginTop: 4 },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "500" },
  pressed: { opacity: 0.75 },
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
  errorText: { color: "#c00", marginBottom: 8 },
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
});
