/**
 * Home completion + logbook write (Phase 7+).
 * All completion dates use getEffectiveToday() / formatDateYMD from storage (debug override aware).
 * Undo is Phase 9 — Logbook only (see undoLogbookExerciseToHome in storage).
 */

import type { HomeMergedRow } from "./homeDisplay";
import {
  addLogbookEntry,
  formatDateYMD,
  getLogbook,
  removeHomeStandaloneExerciseById,
  removeLogbookEntryWhere,
} from "./storage";

export function buildLogbookPayloadFromRow(
  row: HomeMergedRow,
): Record<string, unknown> {
  const ex = row.exercise;
  const base: Record<string, unknown> = {
    id: ex.id,
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight,
    duration: ex.duration,
  };
  if (row.source === "goal") {
    base.__homeSource = "goal";
    base.__goalId = row.goalId;
  } else {
    base.__homeSource = "standalone";
  }
  return base;
}

function completionIdentityMatch(
  stored: unknown,
  incoming: Record<string, unknown>,
): boolean {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return false;
  }
  const s = stored as Record<string, unknown>;
  const ida = String(s.id ?? "").trim();
  const idb = String(incoming.id ?? "").trim();
  if (!ida || !idb || ida !== idb) {
    return false;
  }
  const sa = s.__homeSource === "goal" ? "goal" : "standalone";
  const sb = incoming.__homeSource === "goal" ? "goal" : "standalone";
  if (sa !== sb) {
    return false;
  }
  if (sa === "goal") {
    return String(s.__goalId ?? "") === String(incoming.__goalId ?? "");
  }
  return true;
}

export async function isAlreadyCompletedForDate(
  row: HomeMergedRow,
  dateYmd: string,
): Promise<boolean> {
  try {
    const book = await getLogbook();
    const day = book.find((d) => d.date === dateYmd);
    if (!day || !Array.isArray(day.exercises)) {
      return false;
    }
    const incoming = buildLogbookPayloadFromRow(row);
    return day.exercises.some((ex) => completionIdentityMatch(ex, incoming));
  } catch {
    return false;
  }
}

/** Public alias — same as isAlreadyCompletedForDate */
export async function isExerciseCompletedForDate(
  row: HomeMergedRow,
  dateYmd: string,
): Promise<boolean> {
  return isAlreadyCompletedForDate(row, dateYmd);
}

/**
 * Persists completion: logbook append, then remove standalone from Home storage if needed.
 * Goal rows are not mutated; Home list hides them via logbook filter for this date.
 */
export async function executeHomeCompletion(
  row: HomeMergedRow,
  effectiveDate: Date,
): Promise<{ ok: boolean }> {
  const dateYmd = formatDateYMD(effectiveDate);

  if (await isAlreadyCompletedForDate(row, dateYmd)) {
    return { ok: false };
  }

  const payload = buildLogbookPayloadFromRow(row);
  const logResult = await addLogbookEntry(payload, dateYmd);
  if (!logResult.ok) {
    return { ok: false };
  }
  if (!logResult.appended) {
    return { ok: false };
  }

  if (row.source === "standalone") {
    const removed = await removeHomeStandaloneExerciseById(row.exercise.id);
    if (!removed) {
      await removeLogbookEntryWhere(dateYmd, (ex) =>
        completionIdentityMatch(ex, payload),
      );
      return { ok: false };
    }
  }

  return { ok: true };
}
