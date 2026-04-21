import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColors } from "../context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import type { ProfileStackParamList } from "../navigation/profileStackTypes";
import {
  formatHomeDateHeader,
  formatHomeExerciseDetails,
  normalizeExerciseForHome,
  type HomeExerciseShape,
} from "../utils/homeDisplay";
import { getLogbook, undoLogbookExerciseToHome } from "../utils/storage";
import { SCREEN_HORIZONTAL, SPACING, typography } from "../utils/theme";

type Props = NativeStackScreenProps<ProfileStackParamList, "Logbook">;

function createLogbookStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: SCREEN_HORIZONTAL,
      backgroundColor: colors.background,
    },
    emptyText: {
      ...(typography.body as TextStyle),
      textAlign: "center",
      color: colors.textSecondary,
    },
    hint: {
      ...(typography.caption as TextStyle),
      color: colors.textSecondary,
      marginBottom: SPACING.md,
      lineHeight: SPACING.lg - SPACING.xs,
    },
    sectionHeader: {
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    sectionTitle: {
      ...(typography.subheader as TextStyle),
      color: colors.textPrimary,
    },
    sectionYmd: {
      ...(typography.caption as TextStyle),
      color: colors.textMuted,
      marginTop: SPACING.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.md,
      opacity: 0.65,
      backgroundColor: colors.background,
    },
    rowPressed: { opacity: 0.9 },
    checkboxDone: {
      width: SPACING.lg,
      height: SPACING.lg,
      borderRadius: SPACING.xs,
      borderWidth: 2,
      borderColor: colors.neutralBorder,
      marginRight: SPACING.md,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxMark: {
      ...(typography.overline as TextStyle),
      color: colors.textSecondary,
    },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: {
      ...(typography.subheader as TextStyle),
      color: colors.textPrimary,
    },
    rowMeta: {
      ...(typography.body as TextStyle),
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
  });
}

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

export default function LogbookScreen(_props: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createLogbookStyles(colors), [colors]);
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (sections.length === 0 || sections.every((s) => s.data.length === 0)) {
    return (
      <View
        style={[
          styles.emptyWrap,
          { paddingBottom: SPACING.lg + insets.bottom },
        ]}
      >
        <Text style={styles.emptyText}>No logbook entries yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              onPress={() => void handleUndoRow(section.dateKey, item)}
              accessibilityRole="button"
              accessibilityLabel={`Restore ${name} to Home`}
            >
              <View style={styles.checkboxDone}>
                <Text style={styles.checkboxMark}>✓</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={3}>
                  {name}
                </Text>
                {detail !== "" ? (
                  <Text style={styles.rowMeta}>{detail}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_HORIZONTAL,
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.lg + insets.bottom,
        }}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}
