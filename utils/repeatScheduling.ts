/**
 * Phase 4 — isolated helpers for future Home / completion logic.
 * Home does not consume these yet; repeat matching will wire in Phase 6+.
 */

import { formatDateYMD, getEffectiveToday } from "./storage";

/** @returns {string} YYYY-MM-DD for the effective calendar day */
export function getEffectiveTodayYMD() {
  return formatDateYMD(getEffectiveToday());
}

/**
 * Placeholder: future implementation will evaluate repeat vs effective today.
 * @param {unknown} _repeat
 * @returns {boolean}
 */
export function doesRepeatMatchToday(_repeat: unknown): boolean {
  void _repeat;
  return false;
}
