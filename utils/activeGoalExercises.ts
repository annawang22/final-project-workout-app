import { formatDateYMD, getEffectiveToday, getGoals, sanitizeRepeatConfig } from "./storage";

type GoalShape = {
  id: string;
  text: string;
  exercises: unknown[];
  isActiveOnHome: boolean;
};

export type ActiveGoalExercise = {
  goalId: string;
  goalText: string;
  exercise: unknown;
};

function isRepeatEligibleForHomePhase5(rawRepeat: unknown, _todayYmd: string): boolean {
  if (rawRepeat == null) {
    return true;
  }
  const clean = sanitizeRepeatConfig(rawRepeat);
  if (!clean) {
    return false;
  }
  // Phase 5 intentionally does not apply full repeat/date matching yet.
  // Keep this seam for Phase 6 when full filtering is introduced.
  return true;
}

/**
 * Data-prep helper for Home (Phase 5): flatten exercises from active goals only.
 * - User isolation is inherited from `getGoals()` (active-user scoped key).
 * - Repeat is not fully filtered yet (Phase 6), but null/non-null is handled safely.
 */
export async function getActiveGoalExercises(): Promise<ActiveGoalExercise[]> {
  const todayYmd = formatDateYMD(getEffectiveToday());
  const goals = (await getGoals()) as GoalShape[];
  if (!Array.isArray(goals) || goals.length === 0) {
    return [];
  }
  const out: ActiveGoalExercise[] = [];
  for (const g of goals) {
    if (!g || typeof g !== "object" || !g.isActiveOnHome) {
      continue;
    }
    const list = Array.isArray(g.exercises) ? g.exercises : [];
    for (const ex of list) {
      const repeat =
        ex && typeof ex === "object" && "repeat" in ex
          ? (ex as { repeat?: unknown }).repeat
          : null;
      if (!isRepeatEligibleForHomePhase5(repeat, todayYmd)) {
        continue;
      }
      out.push({
        goalId: String(g.id),
        goalText: String(g.text ?? ""),
        exercise: ex,
      });
    }
  }
  return out;
}
