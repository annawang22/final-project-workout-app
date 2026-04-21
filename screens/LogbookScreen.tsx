import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ProfileStackParamList } from "../navigation/profileStackTypes";
import {
  formatHomeDateHeader,
  formatHomeExerciseDetails,
  normalizeExerciseForHome,
  type HomeExerciseShape,
} from "../utils/homeDisplay";
import { getLogbook, undoLogbookExerciseToHome } from "../utils/storage";

type Props = NativeStackScreenProps<ProfileStackParamList, "Logbook">;

function ymdToLocalDate(ymd: string): Date {
  const parts = String(ymd).trim().split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (
    parts.length !== 3 ||
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d)
  ) {
    return new Date(NaN);
  }
  const dt = new Date(y, m - 1, d);
  dt.setHours(12, 0, 0, 0);
  return dt;
}

function exerciseRowShape(ex: unknown): HomeExerciseShape | null {
  return normalizeExerciseForHome(ex);
}

function rowUndoKey(dateKey: string, item: unknown): string {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return `${dateKey}:bad`;
  }
  const o = item as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  const g =
    o.__homeSource === "goal" ? String(o.__goalId ?? "").trim() : "standalone";
  return `${dateKey}|${g}|${id}`;
}

export default function LogbookScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<
    { title: string; dateKey: string; data: unknown[]; key: string }[]
  >([]);
  const undoingKeys = useRef(new Set<string>());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const book = await getLogbook();
      const sorted = [...book].sort((a, b) =>
        String(b.date ?? "").localeCompare(String(a.date ?? "")),
      );
      const next = sorted
        .map((day) => {
          const dateKey = String(day.date ?? "").trim();
          const dt = ymdToLocalDate(dateKey);
          const header = Number.isNaN(dt.getTime())
            ? dateKey
            : formatHomeDateHeader(dt);
          const exercises = Array.isArray(day.exercises) ? day.exercises : [];
          return {
            key: dateKey || `orphan-${header}`,
            title: header,
            dateKey,
            data: exercises,
          };
        })
        .filter((s) => s.data.length > 0);
      setSections(next);
    } catch (e) {
      console.error("LogbookScreen load", e);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleUndoRow(dateKey: string, item: unknown) {
    const ukey = rowUndoKey(dateKey, item);
    if (undoingKeys.current.has(ukey)) {
      return;
    }
    undoingKeys.current.add(ukey);
    try {
      const ok = await undoLogbookExerciseToHome(dateKey, item);
      if (ok) {
        await load();
      }
    } catch (e) {
      console.error("LogbookScreen undo", e);
    } finally {
      undoingKeys.current.delete(ukey);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (sections.length === 0 || sections.every((s) => s.data.length === 0)) {
    return (
      <View style={[styles.emptyWrap, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.emptyText}>No logbook entries yet.</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      ListHeaderComponent={
        <Text style={styles.hint}>
          Tap a completed exercise to restore it to Home.
        </Text>
      }
      keyExtractor={(item, index) => {
        const sh = exerciseRowShape(item);
        const id =
          sh?.id ??
          String(
            item && typeof item === "object" && !Array.isArray(item)
              ? (item as Record<string, unknown>).id
              : "",
          ).trim();
        return id ? `e:${id}:${index}` : `row:${index}`;
      }}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionYmd}>{section.dateKey}</Text>
        </View>
      )}
      renderItem={({ item, section }) => {
        const shaped = exerciseRowShape(item);
        const name =
          shaped?.name ??
          (typeof item === "object" &&
          item &&
          String((item as Record<string, unknown>).name ?? "").trim()
            ? String((item as Record<string, unknown>).name).trim()
            : "Exercise");
        const detail = shaped ? formatHomeExerciseDetails(shaped) : "";
        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => void handleUndoRow(section.dateKey, item)}
            accessibilityRole="button"
            accessibilityLabel={`Restore ${name} to Home`}
          >
            <View style={styles.checkboxDone}>
              <Text style={styles.checkboxMark}>✓</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{name}</Text>
              {detail !== "" ? (
                <Text style={styles.rowMeta}>{detail}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24 + insets.bottom,
      }}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  hint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  sectionYmd: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    opacity: 0.65,
  },
  rowPressed: { opacity: 0.9 },
  checkboxDone: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#888",
    marginRight: 12,
    marginTop: 2,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: { fontSize: 12, fontWeight: "700", color: "#555" },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#555" },
  rowMeta: { fontSize: 14, color: "#777", marginTop: 4 },
});
