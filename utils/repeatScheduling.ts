/**
 * Repeat evaluation for Home (Phase 6+). Pass effectiveDate from getEffectiveToday()
 * so debug date override and real calendar stay consistent.
 */

import type { RepeatConfig } from "../types/repeat";
import { formatDateYMD, getEffectiveToday, sanitizeRepeatConfig } from "./storage";

const MS_PER_DAY = 86400000;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function startOfCalendarDay(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(12, 0, 0, 0);
  return x;
}

/** Whole calendar days from a to b (b ≥ a → ≥ 0). */
function calendarDaysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / MS_PER_DAY);
}

function parseYmdLocal(ymd: string): Date | null {
  const t = String(ymd).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const [y, m, d] = t.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) {
    return null;
  }
  dt.setHours(12, 0, 0, 0);
  return dt;
}

/**
 * Whether a goal exercise's repeat rule includes `effectiveDate` (defensive; never throws).
 */
export function repeatConfigMatchesDate(
  rawRepeat: unknown,
  effectiveDate: Date,
): boolean {
  try {
    if (rawRepeat == null) {
      return true;
    }
    const cfg = sanitizeRepeatConfig(rawRepeat) as RepeatConfig | null;
    if (!cfg) {
      return false;
    }
    const todayYmd = formatDateYMD(effectiveDate);
    if (todayYmd < cfg.startDate) {
      return false;
    }
    if (cfg.endType === "date") {
      const ed = cfg.endDate;
      if (typeof ed === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ed) && todayYmd > ed) {
        return false;
      }
    }

    const start = parseYmdLocal(cfg.startDate);
    if (!start) {
      return false;
    }
    const eff = startOfCalendarDay(effectiveDate);
    if (eff < start) {
      return false;
    }

    const interval = Math.max(
      1,
      typeof cfg.interval === "number" && Number.isFinite(cfg.interval)
        ? cfg.interval
        : 1,
    );
    const freq = cfg.frequency;

    if (freq === "day") {
      const d0 = calendarDaysBetween(start, eff);
      if (d0 < 0) {
        return false;
      }
      return d0 % interval === 0;
    }

    if (freq === "week") {
      const days = Array.isArray(cfg.daysOfWeek) ? cfg.daysOfWeek : [];
      if (days.length === 0) {
        return false;
      }
      const wname = WEEKDAY_NAMES[eff.getDay()];
      if (!days.includes(wname)) {
        return false;
      }
      const d0 = calendarDaysBetween(start, eff);
      if (d0 < 0) {
        return false;
      }
      const w = Math.floor(d0 / 7);
      return w % interval === 0;
    }

    if (freq === "month") {
      const months =
        (eff.getFullYear() - start.getFullYear()) * 12 +
        (eff.getMonth() - start.getMonth());
      if (months < 0) {
        return false;
      }
      if (months % interval !== 0) {
        return false;
      }
      const lastDom = new Date(eff.getFullYear(), eff.getMonth() + 1, 0).getDate();
      const wantDom = Math.min(start.getDate(), lastDom);
      return eff.getDate() === wantDom;
    }

    if (freq === "year") {
      const yDiff = eff.getFullYear() - start.getFullYear();
      if (yDiff < 0) {
        return false;
      }
      if (yDiff % interval !== 0) {
        return false;
      }
      const lastDom = new Date(eff.getFullYear(), eff.getMonth() + 1, 0).getDate();
      const wantDom = Math.min(start.getDate(), lastDom);
      return (
        eff.getMonth() === start.getMonth() && eff.getDate() === wantDom
      );
    }

    return false;
  } catch {
    return false;
  }
}

/** @returns YYYY-MM-DD for the effective calendar day (respects debug override). */
export function getEffectiveTodayYMD(): string {
  return formatDateYMD(getEffectiveToday());
}
