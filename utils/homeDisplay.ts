import { getActiveGoalExercisesForDate } from "./activeGoalExercises";
import { getHomeStandaloneExercises } from "./storage";

export type HomeExerciseShape = {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration: string | null;
};

export type HomeMergedRow =
  | {
      source: "goal";
      key: string;
      goalId: string;
      goalText: string;
      exercise: HomeExerciseShape;
    }
  | {
      source: "standalone";
      key: string;
      exercise: HomeExerciseShape;
    };

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Header line like `"Monday, April 20"` using the effective app calendar date. */
export function formatHomeDateHeader(effectiveDate: Date): string {
  const w = WEEKDAYS[effectiveDate.getDay()] ?? "Day";
  const m = MONTHS[effectiveDate.getMonth()] ?? "Month";
  return `${w}, ${m} ${effectiveDate.getDate()}`;
}

function coerceNum(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const n = Number(String(v).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Coerce a goal exercise payload into a safe Home row shape; returns null if unusable. */
export function normalizeExerciseForHome(ex: unknown): HomeExerciseShape | null {
  if (!ex || typeof ex !== "object" || Array.isArray(ex)) {
    return null;
  }
  const o = ex as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  const name = String(o.name ?? "").trim();
  if (!id || !name) {
    return null;
  }
  const dur =
    o.duration != null && String(o.duration).trim() !== ""
      ? String(o.duration).trim()
      : null;
  return {
    id,
    name,
    sets: coerceNum(o.sets),
    reps: coerceNum(o.reps),
    weight: coerceNum(o.weight),
    duration: dur,
  };
}

/**
 * Standalone Home exercises (always included) + goal-based rows that match the effective date.
 * Keys are unique per source so similar names from different sources both render.
 */
export async function getMergedHomeExerciseRows(
  effectiveDate: Date,
): Promise<HomeMergedRow[]> {
  const [goalRows, standalone] = await Promise.all([
    getActiveGoalExercisesForDate(effectiveDate),
    getHomeStandaloneExercises(),
  ]);

  const out: HomeMergedRow[] = [];

  for (const row of goalRows) {
    const ex = normalizeExerciseForHome(row.exercise);
    if (!ex) {
      continue;
    }
    out.push({
      source: "goal",
      key: `g:${row.goalId}:e:${ex.id}`,
      goalId: row.goalId,
      goalText: row.goalText,
      exercise: ex,
    });
  }

  for (const raw of standalone) {
    const ex = normalizeExerciseForHome(raw);
    if (!ex) {
      continue;
    }
    out.push({
      source: "standalone",
      key: `s:${ex.id}`,
      exercise: ex,
    });
  }

  return out;
}

export function formatHomeExerciseDetails(ex: HomeExerciseShape): string {
  const parts: string[] = [];
  if (ex.sets != null) {
    parts.push(`${ex.sets} set${ex.sets === 1 ? "" : "s"}`);
  }
  if (ex.reps != null) {
    parts.push(`${ex.reps} rep${ex.reps === 1 ? "" : "s"}`);
  }
  if (ex.weight != null) {
    parts.push(String(ex.weight));
  }
  if (ex.duration) {
    parts.push(ex.duration);
  }
  return parts.join(" · ");
}
