import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { AppColors } from "../context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import type { RepeatConfig, RepeatFrequency } from "../types/repeat";
import {
  formatDateYMD,
  getEffectiveToday,
  sanitizeRepeatConfig,
} from "../utils/storage";

const WEEKDAYS: string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const FREQS: RepeatFrequency[] = ["day", "week", "month", "year"];

type Props = {
  visible: boolean;
  initialRepeat: RepeatConfig | null;
  onApply: (repeat: RepeatConfig | null) => void;
  onCancel: () => void;
};

function parseYmd(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const [y, m, d] = t.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function createRepeatStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    fill: { flex: 1 },
    card: {
      maxHeight: "88%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      padding: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 10,
      color: colors.textPrimary,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 4,
      color: colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginBottom: 6,
      color: colors.textPrimary,
    },
    rowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 4,
    },
    row: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 4,
      marginBottom: 4,
    },
    chipOn: {
      backgroundColor: colors.interactiveStrong,
      borderColor: colors.interactiveStrong,
    },
    chipText: { fontSize: 13, color: colors.textPrimary },
    chipTextOn: { color: colors.onInteractive },
    linkBtn: { marginBottom: 8 },
    link: { color: colors.link, fontSize: 16 },
    error: { color: colors.danger, marginTop: 8 },
    removeBtn: { marginTop: 12, marginBottom: 8 },
    removeText: { color: colors.danger, fontSize: 15 },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 12,
    },
    actionCancel: { marginRight: 16 },
    primary: {
      backgroundColor: colors.interactiveStrong,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
    },
    primaryText: { color: colors.onInteractive, fontWeight: "600" },
  });
}

export default function RepeatConfigModal({
  visible,
  initialRepeat,
  onApply,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createRepeatStyles(colors), [colors]);
  const [frequency, setFrequency] = useState<RepeatFrequency>("week");
  const [intervalStr, setIntervalStr] = useState("1");
  const [days, setDays] = useState<string[]>([]);
  const [startMode, setStartMode] = useState<"today" | "pick">("today");
  const [startYmd, setStartYmd] = useState(() =>
    formatDateYMD(getEffectiveToday()),
  );
  const [endMode, setEndMode] = useState<"never" | "date">("never");
  const [endYmd, setEndYmd] = useState("");
  const [picker, setPicker] = useState<null | "start" | "end">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setError(null);
    setPicker(null);
    const r = initialRepeat;
    if (r) {
      setFrequency(r.frequency);
      setIntervalStr(String(r.interval ?? 1));
      setDays(Array.isArray(r.daysOfWeek) ? [...r.daysOfWeek] : []);
      const todayY = formatDateYMD(getEffectiveToday());
      setStartMode(r.startDate === todayY ? "today" : "pick");
      setStartYmd(r.startDate || todayY);
      setEndMode(r.endType === "date" ? "date" : "never");
      setEndYmd(r.endDate ?? "");
    } else {
      setFrequency("week");
      setIntervalStr("1");
      setDays([]);
      setStartMode("today");
      setStartYmd(formatDateYMD(getEffectiveToday()));
      setEndMode("never");
      setEndYmd("");
    }
  }, [visible, initialRepeat]);

  function toggleDay(d: string) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function apply() {
    setError(null);
    let interval = parseInt(intervalStr, 10);
    if (!Number.isFinite(interval) || interval < 1) {
      interval = 1;
    }
    const startDate =
      startMode === "today"
        ? formatDateYMD(getEffectiveToday())
        : startYmd.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setError("Start date must be YYYY-MM-DD.");
      return;
    }
    let endType: "never" | "date" = "never";
    let endDate: string | null = null;
    if (endMode === "date") {
      const ed = endYmd.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ed)) {
        setError("End date must be YYYY-MM-DD.");
        return;
      }
      if (ed < startDate) {
        setError("End date cannot be before start date.");
        return;
      }
      endType = "date";
      endDate = ed;
    }
    const draft = {
      frequency,
      interval,
      daysOfWeek: frequency === "week" ? days : [],
      startDate,
      endType,
      endDate,
    };
    if (frequency === "week" && draft.daysOfWeek.length === 0) {
      setError("Pick at least one day of the week.");
      return;
    }
    const cleaned = sanitizeRepeatConfig(draft);
    if (!cleaned) {
      setError("Could not build repeat rule.");
      return;
    }
    onApply(cleaned as RepeatConfig);
  }

  function removeRepeat() {
    setError(null);
    onApply(null);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.fill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>Repeat</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Every</Text>
            <View style={styles.rowWrap}>
              {FREQS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFrequency(f)}
                  style={[
                    styles.chip,
                    frequency === f && styles.chipOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      frequency === f && styles.chipTextOn,
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Interval</Text>
            <TextInput
              style={styles.input}
              value={intervalStr}
              onChangeText={setIntervalStr}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.placeholder}
            />

            {frequency === "week" ? (
              <>
                <Text style={styles.label}>On (days of week)</Text>
                <View style={styles.rowWrap}>
                  {WEEKDAYS.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => toggleDay(d)}
                      style={[styles.chip, days.includes(d) && styles.chipOn]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          days.includes(d) && styles.chipTextOn,
                        ]}
                        numberOfLines={1}
                      >
                        {d.slice(0, 3)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.label}>Starts</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.chip, startMode === "today" && styles.chipOn]}
                onPress={() => {
                  setStartMode("today");
                  setStartYmd(formatDateYMD(getEffectiveToday()));
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    startMode === "today" && styles.chipTextOn,
                  ]}
                >
                  Today
                </Text>
              </Pressable>
              <Pressable
                style={[styles.chip, startMode === "pick" && styles.chipOn]}
                onPress={() => setStartMode("pick")}
              >
                <Text
                  style={[
                    styles.chipText,
                    startMode === "pick" && styles.chipTextOn,
                  ]}
                >
                  Pick date
                </Text>
              </Pressable>
            </View>
            {startMode === "pick" ? (
              <>
                <TextInput
                  style={styles.input}
                  value={startYmd}
                  onChangeText={setStartYmd}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.placeholder}
                />
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => setPicker("start")}
                >
                  <Text style={styles.link}>Open date picker</Text>
                </Pressable>
              </>
            ) : null}

            <Text style={styles.label}>Ends</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.chip, endMode === "never" && styles.chipOn]}
                onPress={() => setEndMode("never")}
              >
                <Text
                  style={[
                    styles.chipText,
                    endMode === "never" && styles.chipTextOn,
                  ]}
                >
                  Never
                </Text>
              </Pressable>
              <Pressable
                style={[styles.chip, endMode === "date" && styles.chipOn]}
                onPress={() => setEndMode("date")}
              >
                <Text
                  style={[
                    styles.chipText,
                    endMode === "date" && styles.chipTextOn,
                  ]}
                >
                  On date
                </Text>
              </Pressable>
            </View>
            {endMode === "date" ? (
              <>
                <TextInput
                  style={styles.input}
                  value={endYmd}
                  onChangeText={setEndYmd}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.placeholder}
                />
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => setPicker("end")}
                >
                  <Text style={styles.link}>Open date picker</Text>
                </Pressable>
              </>
            ) : null}

            {picker ? (
              <DateTimePicker
                value={
                  (picker === "start"
                    ? parseYmd(startYmd)
                    : parseYmd(endYmd)) ?? getEffectiveToday()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(ev, date) => {
                  const typ = ev?.type;
                  if (typ === "dismissed") {
                    setPicker(null);
                    return;
                  }
                  if (date) {
                    const y = formatDateYMD(date);
                    if (picker === "start") {
                      setStartYmd(y);
                    } else {
                      setEndYmd(y);
                    }
                  }
                  if (Platform.OS === "android") {
                    setPicker(null);
                  }
                }}
              />
            ) : null}
            {Platform.OS === "ios" && picker ? (
              <Pressable style={styles.linkBtn} onPress={() => setPicker(null)}>
                <Text style={styles.link}>Done</Text>
              </Pressable>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.removeBtn} onPress={removeRepeat}>
              <Text style={styles.removeText}>Remove repeat</Text>
            </Pressable>

            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={styles.actionCancel}>
                <Text style={styles.link}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primary} onPress={apply}>
                <Text style={styles.primaryText}>Apply</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
