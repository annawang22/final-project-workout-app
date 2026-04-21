import { getGoals } from "./storage";
import { repeatConfigMatchesDate } from "./repeatScheduling";

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

/**
 * Exercises from goals active on Home that match `effectiveDate` repeat rules.
 * User isolation comes from `getGoals()` (active-user scoped storage key).
 */
export async function getActiveGoalExercisesForDate(
  effectiveDate: Date,
): Promise<ActiveGoalExercise[]> {
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
      if (!repeatConfigMatchesDate(repeat, effectiveDate)) {
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
