import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { getLogbook } from "../utils/storage";

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

export default function LogbookScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<
    { title: string; dateKey: string; data: unknown[]; key: string }[]
  >([]);

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
      renderItem={({ item }) => {
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
          <View style={styles.row}>
            <View style={styles.checkboxDone}>
              <Text style={styles.checkboxMark}>✓</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{name}</Text>
              {detail !== "" ? (
                <Text style={styles.rowMeta}>{detail}</Text>
              ) : null}
            </View>
          </View>
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
