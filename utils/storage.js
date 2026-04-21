import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage keys used by this app:
 *
 * - accounts        — JSON array: { username, password }[] (canonical store for all accounts)
 * - user (legacy)   — migrated into `accounts` on first read, then removed (was single object or array)
 * - isLoggedIn      — boolean auth state
 * - activeUser      — string username for the current session (which account’s data to load)
 * - goals__u__*      — per-user goal lists (use goalsKeyForUser; legacy "goals" is migrated on read)
 * - home_exercises__u__* — per-user standalone Home exercises (legacy "home_exercises" is migrated on read)
 * - profile         — ProfileObject (name, username, image URI)
 * - logbook__u__*   — per-user logbook (legacy "logbook" migrated on read)
 *
 * DEBUG ONLY (not user data):
 * - debug_date_override__u__* — optional YYYY-MM-DD override for getEffectiveToday() per user
 */

const KEYS = {
  ACCOUNTS: "accounts",
  USER: "user",
  IS_LOGGED_IN: "isLoggedIn",
  ACTIVE_USER: "activeUser",
  /** @deprecated pre–per-user migration; unscoped list moved into the active user’s key */
  GOALS_LEGACY: "goals",
  /** @deprecated pre–per-user migration; unscoped Home list moved into the active user’s key */
  HOME_EXERCISES_LEGACY: "home_exercises",
  /** @deprecated pre–per-user migration */
  LOGBOOK_LEGACY: "logbook",
};

/**
 * DEBUG ONLY — AsyncStorage key for fake “today” while testing repeat scheduling
 * without changing the device clock. Scoped per username like goals.
 * @param {string} username
 */
function debugDateOverrideKeyForUser(username) {
  return `debug_date_override__u__${encodeURIComponent(String(username))}`;
}

/** @type {string | null} */
let _cachedDebugDateOverrideYmd = null;

/**
 * Returns the calendar date the app should treat as “today” for repeat / scheduling tests.
 * Uses DEBUG date override when set for the active user; otherwise the real system date.
 * @returns {Date}
 */
export function getEffectiveToday() {
  if (
    _cachedDebugDateOverrideYmd &&
    /^\d{4}-\d{2}-\d{2}$/.test(_cachedDebugDateOverrideYmd)
  ) {
    const [y, m, d] = _cachedDebugDateOverrideYmd.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (!Number.isNaN(dt.getTime())) {
      dt.setHours(12, 0, 0, 0);
      return dt;
    }
  }
  const real = new Date();
  real.setHours(12, 0, 0, 0);
  return real;
}

/**
 * @param {Date} d
 * @returns {string}
 */
export function formatDateYMD(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** @returns {string | null} */
export function getDebugDateOverrideCached() {
  return _cachedDebugDateOverrideYmd;
}

export async function refreshDebugDateOverrideCache() {
  try {
    const u = await getActiveUser();
    if (u == null) {
      _cachedDebugDateOverrideYmd = null;
      return;
    }
    const raw = await AsyncStorage.getItem(debugDateOverrideKeyForUser(u));
    if (raw != null && /^\d{4}-\d{2}-\d{2}$/.test(String(raw).trim())) {
      _cachedDebugDateOverrideYmd = String(raw).trim();
    } else {
      _cachedDebugDateOverrideYmd = null;
    }
  } catch (e) {
    console.error("refreshDebugDateOverrideCache", e);
    _cachedDebugDateOverrideYmd = null;
  }
}

/**
 * DEBUG ONLY — persist override YYYY-MM-DD for the active user.
 * @param {string} ymd
 */
export async function setDebugDateOverride(ymd) {
  const u = await getActiveUser();
  if (u == null) {
    return;
  }
  const s = String(ymd).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return;
  }
  try {
    await AsyncStorage.setItem(debugDateOverrideKeyForUser(u), s);
    _cachedDebugDateOverrideYmd = s;
  } catch (e) {
    console.error("setDebugDateOverride", e);
  }
}

/** DEBUG ONLY */
export async function clearDebugDateOverride() {
  try {
    const u = await getActiveUser();
    if (u == null) {
      _cachedDebugDateOverrideYmd = null;
      return;
    }
    await AsyncStorage.removeItem(debugDateOverrideKeyForUser(u));
    _cachedDebugDateOverrideYmd = null;
  } catch (e) {
    console.error("clearDebugDateOverride", e);
  }
}

/**
 * @param {string} username
 * @returns {string}
 */
function goalsKeyForUser(username) {
  return `goals__u__${encodeURIComponent(String(username))}`;
}

/**
 * @param {string} username
 * @returns {string}
 */
function homeExercisesKeyForUser(username) {
  return `home_exercises__u__${encodeURIComponent(String(username))}`;
}

/**
 * @param {string} username
 * @returns {string}
 */
function logbookKeyForUser(username) {
  return `logbook__u__${encodeURIComponent(String(username))}`;
}

/**
 * @returns {Promise<string | null>} username of the account whose data is in use, or null
 */
export async function getActiveUser() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_USER);
    if (raw == null || raw === "") {
      return null;
    }
    return String(raw);
  } catch (e) {
    console.error("getActiveUser", e);
    return null;
  }
}

/**
 * @param {string} username
 */
export async function setActiveUser(username) {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_USER, String(username).trim());
    await refreshDebugDateOverrideCache();
  } catch (e) {
    console.error("setActiveUser", e);
  }
}

export async function clearActiveUser() {
  try {
    _cachedDebugDateOverrideYmd = null;
    await AsyncStorage.removeItem(KEYS.ACTIVE_USER);
  } catch (e) {
    console.error("clearActiveUser", e);
  }
}

/**
 * @param {unknown} g
 * @returns {{ id: string, text: string, exercises: unknown[], isActiveOnHome: boolean } | null}
 */
function normalizeGoalObject(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) {
    return null;
  }
  const o = /** @type {{ id?: unknown; text?: unknown; exercises?: unknown; isActiveOnHome?: unknown }} */ (g);
  const id = o.id != null ? String(o.id).trim() : "";
  if (!id) {
    return null;
  }
  const exArr = Array.isArray(o.exercises) ? o.exercises : [];
  return {
    id,
    text: o.text != null ? String(o.text) : "",
    exercises: exArr
      .map((ex) => normalizeExerciseInGoal(ex))
      .filter(Boolean),
    isActiveOnHome: Boolean(o.isActiveOnHome),
  };
}

function createGoalId() {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function createExerciseId() {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function coerceOptionalNumber(v) {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const s = String(v).trim();
  if (s === "") {
    return null;
  }
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const VALID_REPEAT_FREQ = new Set(["day", "week", "month", "year"]);
const VALID_DAY_NAMES = new Set([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

/**
 * Coerce stored repeat payload into a safe object or null. Never throws.
 * @param {unknown} r
 * @returns {object | null}
 */
export function sanitizeRepeatConfig(r) {
  if (r == null) {
    return null;
  }
  if (typeof r !== "object" || Array.isArray(r)) {
    return null;
  }
  const o = /** @type {Record<string, unknown>} */ (r);
  const rawFreq = String(o.frequency ?? "week").toLowerCase();
  const frequency = VALID_REPEAT_FREQ.has(rawFreq) ? rawFreq : "week";
  let interval = parseInt(String(o.interval ?? "1"), 10);
  if (!Number.isFinite(interval) || interval < 1) {
    interval = 1;
  }
  let daysOfWeek = [];
  if (Array.isArray(o.daysOfWeek)) {
    daysOfWeek = o.daysOfWeek
      .map((d) => String(d))
      .filter((d) => VALID_DAY_NAMES.has(d));
  }
  if (frequency !== "week") {
    daysOfWeek = [];
  }
  let startDate = null;
  const sd = o.startDate;
  if (typeof sd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sd.trim())) {
    startDate = sd.trim();
  }
  if (!startDate) {
    startDate = formatDateYMD(getEffectiveToday());
  }
  const endType = o.endType === "date" ? "date" : "never";
  let endDate = null;
  if (endType === "date") {
    const ed = o.endDate;
    if (typeof ed === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ed.trim())) {
      endDate = ed.trim();
    }
    if (endDate && startDate && endDate < startDate) {
      endDate = startDate;
    }
  }
  if (frequency === "week" && daysOfWeek.length === 0) {
    return null;
  }
  return {
    frequency,
    interval,
    daysOfWeek,
    startDate,
    endType,
    endDate,
  };
}

/**
 * @param {unknown} ex
 * @returns {{ id: string, name: string, sets: number | null, reps: number | null, weight: number | null, duration: string | null, repeat: null } | null}
 */
function normalizeExerciseInGoal(ex) {
  if (!ex || typeof ex !== "object" || Array.isArray(ex)) {
    return null;
  }
  const o = /** @type {{ id?: unknown; name?: unknown; sets?: unknown; reps?: unknown; weight?: unknown; duration?: unknown; repeat?: unknown }} */ (ex);
  const id = o.id != null ? String(o.id).trim() : "";
  if (!id) {
    return null;
  }
  const name = o.name != null ? String(o.name).trim() : "";
  if (!name) {
    return null;
  }
  const dur = o.duration != null ? String(o.duration).trim() : "";
  return {
    id,
    name,
    sets: coerceOptionalNumber(o.sets),
    reps: coerceOptionalNumber(o.reps),
    weight: coerceOptionalNumber(o.weight),
    duration: dur === "" ? null : dur,
    repeat: sanitizeRepeatConfig(o.repeat),
  };
}

/**
 * @returns {Promise<{ id: string, text: string, exercises: unknown[], isActiveOnHome: boolean }[]>}
 */
async function readGoalsFromStorage() {
  const active = await getActiveUser();
  if (active == null) {
    return [];
  }
  const scopedKey = goalsKeyForUser(active);
  let raw = await AsyncStorage.getItem(scopedKey);
  if (raw == null || raw === "") {
    const legacy = await AsyncStorage.getItem(KEYS.GOALS_LEGACY);
    if (legacy != null && legacy !== "") {
      await AsyncStorage.setItem(scopedKey, legacy);
      await AsyncStorage.removeItem(KEYS.GOALS_LEGACY);
      raw = legacy;
    } else {
      return [];
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("readGoalsFromStorage JSON.parse", e);
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map(normalizeGoalObject).filter(Boolean);
}

/**
 * @param {{ id: string, text: string, exercises: unknown[]; isActiveOnHome: boolean }[]} goals
 */
async function writeGoalsToStorage(goals) {
  const active = await getActiveUser();
  if (active == null) {
    return;
  }
  await AsyncStorage.setItem(
    goalsKeyForUser(active),
    JSON.stringify(goals),
  );
}

/**
 * @returns {Promise<{ id: string, text: string, exercises: unknown[], isActiveOnHome: boolean }[]>}
 */
export async function getGoals() {
  try {
    return await readGoalsFromStorage();
  } catch (e) {
    console.error("getGoals", e);
    return [];
  }
}

/**
 * @param {string} text
 * @returns {Promise<{ id: string, text: string, exercises: unknown[], isActiveOnHome: boolean } | null>}
 */
export async function addGoal(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    if ((await getActiveUser()) == null) {
      return null;
    }
    const goals = await readGoalsFromStorage();
    const next = {
      id: createGoalId(),
      text: trimmed,
      exercises: [],
      isActiveOnHome: false,
    };
    goals.push(next);
    await writeGoalsToStorage(goals);
    return next;
  } catch (e) {
    console.error("addGoal", e);
    return null;
  }
}

/**
 * @param {string} id
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function updateGoalText(id, text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const goals = await readGoalsFromStorage();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx < 0) {
      return false;
    }
    const prev = goals[idx];
    goals[idx] = {
      id: prev.id,
      text: trimmed,
      exercises: prev.exercises,
      isActiveOnHome: prev.isActiveOnHome,
    };
    await writeGoalsToStorage(goals);
    return true;
  } catch (e) {
    console.error("updateGoalText", e);
    return false;
  }
}

/**
 * Set one goal's activation flag for Home without touching its exercises.
 * @param {string} id
 * @param {boolean} isActiveOnHome
 * @returns {Promise<boolean>}
 */
export async function setGoalActiveOnHome(id, isActiveOnHome) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const goals = await readGoalsFromStorage();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx < 0) {
      return false;
    }
    const prev = goals[idx];
    goals[idx] = {
      id: prev.id,
      text: prev.text,
      exercises: prev.exercises,
      isActiveOnHome: Boolean(isActiveOnHome),
    };
    await writeGoalsToStorage(goals);
    return true;
  } catch (e) {
    console.error("setGoalActiveOnHome", e);
    return false;
  }
}

/**
 * Toggle one goal's activation flag for Home without mutating exercises.
 * @param {string} id
 * @returns {Promise<boolean | null>} new state, or null if goal not found/error
 */
export async function toggleGoalActiveOnHome(id) {
  try {
    if ((await getActiveUser()) == null) {
      return null;
    }
    const goals = await readGoalsFromStorage();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx < 0) {
      return null;
    }
    const prev = goals[idx];
    const nextActive = !Boolean(prev.isActiveOnHome);
    goals[idx] = {
      id: prev.id,
      text: prev.text,
      exercises: prev.exercises,
      isActiveOnHome: nextActive,
    };
    await writeGoalsToStorage(goals);
    return nextActive;
  } catch (e) {
    console.error("toggleGoalActiveOnHome", e);
    return null;
  }
}

/**
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteGoal(id) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const goals = await readGoalsFromStorage();
    const next = goals.filter((g) => g.id !== id);
    if (next.length === goals.length) {
      return false;
    }
    await writeGoalsToStorage(next);
    return true;
  } catch (e) {
    console.error("deleteGoal", e);
    return false;
  }
}

/**
 * @param {string} goalId
 * @returns {Promise<object | null>}
 */
export async function getGoalById(goalId) {
  try {
    if ((await getActiveUser()) == null) {
      return null;
    }
    const goals = await readGoalsFromStorage();
    return goals.find((g) => g.id === goalId) ?? null;
  } catch (e) {
    console.error("getGoalById", e);
    return null;
  }
}

/**
 * @param {string} goalId
 * @param {{ name: unknown; sets?: unknown; reps?: unknown; weight?: unknown; duration?: unknown; repeat?: unknown }} fields
 * @returns {Promise<object | null>}
 */
export async function addExerciseToGoal(goalId, fields) {
  const name = String(fields.name ?? "").trim();
  if (name.length === 0) {
    return null;
  }
  try {
    if ((await getActiveUser()) == null) {
      return null;
    }
    const goals = await readGoalsFromStorage();
    const gIdx = goals.findIndex((g) => g.id === goalId);
    if (gIdx < 0) {
      return null;
    }
    const prev = goals[gIdx];
    const ex = {
      id: createExerciseId(),
      name,
      sets: coerceOptionalNumber(fields.sets),
      reps: coerceOptionalNumber(fields.reps),
      weight: coerceOptionalNumber(fields.weight),
      duration:
        fields.duration != null && String(fields.duration).trim() !== ""
          ? String(fields.duration).trim()
          : null,
      repeat:
        fields.repeat !== undefined
          ? sanitizeRepeatConfig(fields.repeat)
          : null,
    };
    const prevEx = Array.isArray(prev.exercises) ? prev.exercises : [];
    const nextEx = [...prevEx, ex];
    goals[gIdx] = {
      id: prev.id,
      text: prev.text,
      exercises: nextEx,
      isActiveOnHome: prev.isActiveOnHome,
    };
    await writeGoalsToStorage(goals);
    return ex;
  } catch (e) {
    console.error("addExerciseToGoal", e);
    return null;
  }
}

/**
 * @param {string} goalId
 * @param {string} exerciseId
 * @param {{ name: unknown; sets?: unknown; reps?: unknown; weight?: unknown; duration?: unknown; repeat?: unknown }} fields
 * @returns {Promise<boolean>}
 */
export async function updateExerciseInGoal(goalId, exerciseId, fields) {
  const name = String(fields.name ?? "").trim();
  if (name.length === 0) {
    return false;
  }
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const goals = await readGoalsFromStorage();
    const gIdx = goals.findIndex((g) => g.id === goalId);
    if (gIdx < 0) {
      return false;
    }
    const prev = goals[gIdx];
    const list = Array.isArray(prev.exercises) ? [...prev.exercises] : [];
    const eIdx = list.findIndex(
      (e) => e && typeof e === "object" && "id" in e && e.id === exerciseId,
    );
    if (eIdx < 0) {
      return false;
    }
    const old = list[eIdx];
    const oldRep =
      old && typeof old === "object" && "repeat" in old ? old.repeat : null;
    const nextRepeat =
      fields.repeat !== undefined
        ? sanitizeRepeatConfig(fields.repeat)
        : sanitizeRepeatConfig(oldRep);
    list[eIdx] = {
      id: exerciseId,
      name,
      sets: coerceOptionalNumber(fields.sets),
      reps: coerceOptionalNumber(fields.reps),
      weight: coerceOptionalNumber(fields.weight),
      duration:
        fields.duration != null && String(fields.duration).trim() !== ""
          ? String(fields.duration).trim()
          : null,
      repeat: nextRepeat,
    };
    goals[gIdx] = {
      id: prev.id,
      text: prev.text,
      exercises: list,
      isActiveOnHome: prev.isActiveOnHome,
    };
    await writeGoalsToStorage(goals);
    return true;
  } catch (e) {
    console.error("updateExerciseInGoal", e);
    return false;
  }
}

/**
 * @param {string} goalId
 * @param {string} exerciseId
 * @returns {Promise<boolean>}
 */
export async function deleteExerciseFromGoal(goalId, exerciseId) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const goals = await readGoalsFromStorage();
    const gIdx = goals.findIndex((g) => g.id === goalId);
    if (gIdx < 0) {
      return false;
    }
    const prev = goals[gIdx];
    const before = Array.isArray(prev.exercises) ? prev.exercises : [];
    const list = before.filter((e) => {
      if (!e || typeof e !== "object" || !("id" in e)) {
        return true;
      }
      return e.id !== exerciseId;
    });
    if (list.length === before.length) {
      return false;
    }
    goals[gIdx] = {
      id: prev.id,
      text: prev.text,
      exercises: list,
      isActiveOnHome: prev.isActiveOnHome,
    };
    await writeGoalsToStorage(goals);
    return true;
  } catch (e) {
    console.error("deleteExerciseFromGoal", e);
    return false;
  }
}

/**
 * @param {string} goalId
 * @param {unknown[]} exercisesOrdered
 * @returns {Promise<boolean>}
 */
export async function reorderExercisesInGoal(goalId, exercisesOrdered) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const goals = await readGoalsFromStorage();
    const gIdx = goals.findIndex((g) => g.id === goalId);
    if (gIdx < 0) {
      return false;
    }
    const prev = goals[gIdx];
    const normalized = exercisesOrdered
      .map((ex) => normalizeExerciseInGoal(ex))
      .filter(Boolean);
    goals[gIdx] = {
      id: prev.id,
      text: prev.text,
      exercises: normalized,
      isActiveOnHome: prev.isActiveOnHome,
    };
    await writeGoalsToStorage(goals);
    return true;
  } catch (e) {
    console.error("reorderExercisesInGoal", e);
    return false;
  }
}

function createStandaloneHomeExerciseId() {
  return `home_ex_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {unknown} ex
 * @returns {{ id: string, name: string, sets: number | null, reps: number | null, weight: number | null, duration: string | null } | null}
 */
function normalizeStandaloneExercise(ex) {
  if (!ex || typeof ex !== "object" || Array.isArray(ex)) {
    return null;
  }
  const o = /** @type {{ id?: unknown; name?: unknown; sets?: unknown; reps?: unknown; weight?: unknown; duration?: unknown }} */ (ex);
  const id = o.id != null ? String(o.id).trim() : "";
  if (!id) {
    return null;
  }
  const name = o.name != null ? String(o.name).trim() : "";
  if (!name) {
    return null;
  }
  const dur = o.duration != null ? String(o.duration).trim() : "";
  return {
    id,
    name,
    sets: coerceOptionalNumber(o.sets),
    reps: coerceOptionalNumber(o.reps),
    weight: coerceOptionalNumber(o.weight),
    duration: dur === "" ? null : dur,
  };
}

/**
 * @returns {Promise<{ id: string, name: string, sets: number | null, reps: number | null, weight: number | null, duration: string | null }[]>}
 */
async function readHomeStandaloneFromStorage() {
  const active = await getActiveUser();
  if (active == null) {
    return [];
  }
  const scopedKey = homeExercisesKeyForUser(active);
  let raw = await AsyncStorage.getItem(scopedKey);
  if (raw == null || raw === "") {
    const legacy = await AsyncStorage.getItem(KEYS.HOME_EXERCISES_LEGACY);
    if (legacy != null && legacy !== "") {
      await AsyncStorage.setItem(scopedKey, legacy);
      await AsyncStorage.removeItem(KEYS.HOME_EXERCISES_LEGACY);
      raw = legacy;
    } else {
      return [];
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("readHomeStandaloneFromStorage JSON.parse", e);
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map(normalizeStandaloneExercise).filter(Boolean);
}

/**
 * @param {{ id: string, name: string, sets: number | null, reps: number | null, weight: number | null, duration: string | null }[]} rows
 */
async function writeHomeStandaloneToStorage(rows) {
  const active = await getActiveUser();
  if (active == null) {
    return;
  }
  await AsyncStorage.setItem(
    homeExercisesKeyForUser(active),
    JSON.stringify(rows),
  );
}

/**
 * @returns {Promise<{ id: string, name: string, sets: number | null, reps: number | null, weight: number | null, duration: string | null }[]>}
 */
export async function getHomeStandaloneExercises() {
  try {
    if ((await getActiveUser()) == null) {
      return [];
    }
    return await readHomeStandaloneFromStorage();
  } catch (e) {
    console.error("getHomeStandaloneExercises", e);
    return [];
  }
}

/**
 * @param {{ name: unknown; sets?: unknown; reps?: unknown; weight?: unknown; duration?: unknown }} fields
 * @returns {Promise<{ id: string, name: string, sets: number | null, reps: number | null, weight: number | null, duration: string | null } | null>}
 */
export async function addHomeStandaloneExercise(fields) {
  const name = String(fields.name ?? "").trim();
  if (name.length === 0) {
    return null;
  }
  try {
    if ((await getActiveUser()) == null) {
      return null;
    }
    const list = await readHomeStandaloneFromStorage();
    const ex = {
      id: createStandaloneHomeExerciseId(),
      name,
      sets: coerceOptionalNumber(fields.sets),
      reps: coerceOptionalNumber(fields.reps),
      weight: coerceOptionalNumber(fields.weight),
      duration:
        fields.duration != null && String(fields.duration).trim() !== ""
          ? String(fields.duration).trim()
          : null,
    };
    const next = [...list, ex];
    await writeHomeStandaloneToStorage(next);
    return ex;
  } catch (e) {
    console.error("addHomeStandaloneExercise", e);
    return null;
  }
}

/**
 * @param {unknown} day
 * @returns {{ date: string, exercises: unknown[] } | null}
 */
function normalizeLogbookDay(day) {
  if (!day || typeof day !== "object" || Array.isArray(day)) {
    return null;
  }
  const o = /** @type {{ date?: unknown; exercises?: unknown }} */ (day);
  const date = o.date != null ? String(o.date).trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const exercises = Array.isArray(o.exercises) ? o.exercises : [];
  return { date, exercises };
}

/**
 * @returns {Promise<{ date: string, exercises: unknown[] }[]>}
 */
async function readLogbookFromStorage() {
  const active = await getActiveUser();
  if (active == null) {
    return [];
  }
  const scopedKey = logbookKeyForUser(active);
  let raw = await AsyncStorage.getItem(scopedKey);
  if (raw == null || raw === "") {
    const legacy = await AsyncStorage.getItem(KEYS.LOGBOOK_LEGACY);
    if (legacy != null && legacy !== "") {
      await AsyncStorage.setItem(scopedKey, legacy);
      await AsyncStorage.removeItem(KEYS.LOGBOOK_LEGACY);
      raw = legacy;
    } else {
      return [];
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("readLogbookFromStorage JSON.parse", e);
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map(normalizeLogbookDay).filter(Boolean);
}

/**
 * @param {{ date: string, exercises: unknown[] }[]} book
 */
async function writeLogbookToStorage(book) {
  const active = await getActiveUser();
  if (active == null) {
    return;
  }
  await AsyncStorage.setItem(
    logbookKeyForUser(active),
    JSON.stringify(book),
  );
}

/**
 * @returns {Promise<{ date: string, exercises: unknown[] }[]>}
 */
export async function getLogbook() {
  try {
    if ((await getActiveUser()) == null) {
      return [];
    }
    return await readLogbookFromStorage();
  } catch (e) {
    console.error("getLogbook", e);
    return [];
  }
}

/**
 * @param {{ date: string, exercises: unknown[] }[]} book
 * @returns {Promise<boolean>}
 */
export async function saveLogbook(book) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    if (!Array.isArray(book)) {
      return false;
    }
    const normalized = book.map(normalizeLogbookDay).filter(Boolean);
    await writeLogbookToStorage(normalized);
    return true;
  } catch (e) {
    console.error("saveLogbook", e);
    return false;
  }
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function logbookCompletionSame(a, b) {
  if (!a || !b || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  const pa = /** @type {Record<string, unknown>} */ (a);
  const pb = /** @type {Record<string, unknown>} */ (b);
  const ida = String(pa.id ?? "").trim();
  const idb = String(pb.id ?? "").trim();
  if (ida === "" || idb === "" || ida !== idb) {
    return false;
  }
  const sa = pa.__homeSource === "goal" ? "goal" : "standalone";
  const sb = pb.__homeSource === "goal" ? "goal" : "standalone";
  if (sa !== sb) {
    return false;
  }
  if (sa === "goal") {
    return String(pa.__goalId ?? "") === String(pb.__goalId ?? "");
  }
  return true;
}

/**
 * Append one exercise snapshot to the logbook under dateYmd (YYYY-MM-DD). Idempotent per completion identity.
 * @param {unknown} exercisePayload — includes optional __homeSource / __goalId for goal completions
 * @param {string} dateYmd
 * @returns {Promise<{ ok: boolean, appended: boolean }>} appended=false means duplicate / already logged (no new row)
 */
export async function addLogbookEntry(exercisePayload, dateYmd) {
  try {
    if ((await getActiveUser()) == null) {
      return { ok: false, appended: false };
    }
    const date = String(dateYmd ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, appended: false };
    }
    const book = await readLogbookFromStorage();
    let idx = book.findIndex((d) => d.date === date);
    if (idx < 0) {
      book.push({ date, exercises: [] });
      idx = book.length - 1;
    }
    const day = book[idx];
    const list = Array.isArray(day.exercises) ? day.exercises : [];
    if (list.some((ex) => logbookCompletionSame(ex, exercisePayload))) {
      await writeLogbookToStorage(book);
      return { ok: true, appended: false };
    }
    day.exercises = [...list, exercisePayload];
    await writeLogbookToStorage(book);
    return { ok: true, appended: true };
  } catch (e) {
    console.error("addLogbookEntry", e);
    return { ok: false, appended: false };
  }
}

/**
 * Remove one entry from logbook day matching predicate (Phase 7 undo).
 * @param {string} dateYmd
 * @param {(ex: unknown) => boolean} predicate
 * @returns {Promise<boolean>}
 */
export async function removeLogbookEntryWhere(dateYmd, predicate) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const date = String(dateYmd ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return false;
    }
    const book = await readLogbookFromStorage();
    const di = book.findIndex((d) => d.date === date);
    if (di < 0) {
      return false;
    }
    const day = book[di];
    const list = Array.isArray(day.exercises) ? [...day.exercises] : [];
    const ri = list.findIndex((ex) => predicate(ex));
    if (ri < 0) {
      return false;
    }
    list.splice(ri, 1);
    day.exercises = list;
    if (list.length === 0) {
      book.splice(di, 1);
    }
    await writeLogbookToStorage(book);
    return true;
  } catch (e) {
    console.error("removeLogbookEntryWhere", e);
    return false;
  }
}

/**
 * @param {string} exerciseId
 * @returns {Promise<boolean>}
 */
export async function removeHomeStandaloneExerciseById(exerciseId) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const id = String(exerciseId ?? "").trim();
    if (!id) {
      return false;
    }
    const list = await readHomeStandaloneFromStorage();
    const next = list.filter((e) => e.id !== id);
    if (next.length === list.length) {
      return false;
    }
    await writeHomeStandaloneToStorage(next);
    return true;
  } catch (e) {
    console.error("removeHomeStandaloneExerciseById", e);
    return false;
  }
}

/**
 * Restore a standalone Home exercise row (same id) after undo — avoids duplicate ids.
 * @param {unknown} exercise
 * @returns {Promise<boolean>}
 */
export async function restoreHomeStandaloneExercise(exercise) {
  try {
    if ((await getActiveUser()) == null) {
      return false;
    }
    const normalized = normalizeStandaloneExercise(exercise);
    if (!normalized) {
      return false;
    }
    const list = await readHomeStandaloneFromStorage();
    if (list.some((e) => e.id === normalized.id)) {
      return true;
    }
    await writeHomeStandaloneToStorage([...list, normalized]);
    return true;
  } catch (e) {
    console.error("restoreHomeStandaloneExercise", e);
    return false;
  }
}

/** Serialize all reads/writes of the accounts list (merge + persist in order). */
let usersStorageChain = Promise.resolve();

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
function runUsersStorage(fn) {
  const next = usersStorageChain.then(() => fn());
  usersStorageChain = next.catch(() => {}).then(() => {});
  return next;
}

/**
 * @param {unknown} row
 * @returns {{ username: string, password: string } | null}
 */
function accountFromUnknown(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return null;
  }
  const o = /** @type {{ username?: unknown; password?: unknown }} */ (row);
  const username = String(o.username ?? "").trim();
  const password = String(o.password ?? "");
  if (username.length === 0 || password.length === 0) {
    return null;
  }
  return { username, password };
}

/**
 * @param {unknown} arr
 * @param {number} [originalLength]
 * @returns {{ username: string, password: string }[]}
 */
function normalizeUserArrayInMemory(arr, originalLength) {
  if (!Array.isArray(arr)) {
    return [];
  }
  const out = [];
  for (const item of arr) {
    const a = accountFromUnknown(item);
    if (a) {
      out.push(a);
    }
  }
  if (originalLength !== undefined && out.length < originalLength && originalLength > 0) {
    console.warn(
      "storage: dropped invalid account rows when parsing (count mismatch)",
    );
  }
  return out;
}

/**
 * @param {{ username: string, password: string }[]} users
 * @returns {{ username: string, password: string }[]}
 */
function dedupeByUsername(users) {
  const map = new Map();
  for (const u of users) {
    map.set(u.username, u);
  }
  return [...map.values()];
}

/**
 * Parse legacy `user` key: array, or single { username, password } object.
 * @param {unknown} parsed
 * @returns {{ username: string, password: string }[]}
 */
function legacyTopLevelToUsers(parsed) {
  if (Array.isArray(parsed)) {
    return normalizeUserArrayInMemory(parsed, parsed.length);
  }
  if (parsed && typeof parsed === "object") {
    const a = accountFromUnknown(parsed);
    return a ? [a] : [];
  }
  return [];
}

/**
 * If `accounts` is missing, copy legacy `user` into `accounts` and delete `user`.
 * Does not run destructive "canonical" rewrites on every read.
 * @returns {Promise<{ username: string, password: string }[] | null>} migrated list, or null if nothing to migrate
 */
async function migrateUserKeyToAccountsIfNeeded() {
  const existing = await AsyncStorage.getItem(KEYS.ACCOUNTS);
  if (existing != null && existing !== "") {
    return null;
  }

  const raw = await AsyncStorage.getItem(KEYS.USER);
  if (raw == null || raw === "") {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("migrate: JSON.parse user", e);
    return null;
  }

  const users = dedupeByUsername(legacyTopLevelToUsers(parsed));
  if (users.length === 0) {
    return null;
  }

  try {
    await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(users));
    await AsyncStorage.removeItem(KEYS.USER);
  } catch (e) {
    console.error("migrate: write accounts", e);
  }

  return users;
}

/** Remove legacy key if present so only `accounts` is the source of truth. */
async function clearLegacyUserKey() {
  try {
    if ((await AsyncStorage.getItem(KEYS.USER)) != null) {
      await AsyncStorage.removeItem(KEYS.USER);
    }
  } catch (e) {
    console.error("clearLegacyUserKey", e);
  }
}

/**
 * Read the canonical account list. No rewrites for string drift on arrays; migration only for legacy or cleanup.
 * @returns {Promise<{ username: string, password: string }[]>}
 */
async function readAccountsList() {
  const raw = await AsyncStorage.getItem(KEYS.ACCOUNTS);
  if (raw == null || raw === "") {
    const migrated = await migrateUserKeyToAccountsIfNeeded();
    if (migrated) {
      return dedupeByUsername(migrated);
    }
    return [];
  }

  await clearLegacyUserKey();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("readAccountsList JSON.parse", e);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("readAccountsList: expected JSON array in accounts");
    return [];
  }

  return dedupeByUsername(
    normalizeUserArrayInMemory(parsed, parsed.length),
  );
}

/**
 * @param {{ username: string, password: string }[]} users
 */
async function writeAccountsList(users) {
  const list = dedupeByUsername(users);
  await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(list));
  await clearLegacyUserKey();
}

/**
 * @returns {Promise<{ username: string, password: string }[]>}
 */
export async function getUsers() {
  try {
    return await runUsersStorage(() => readAccountsList());
  } catch (e) {
    console.error("getUsers", e);
    return [];
  }
}

/**
 * @param {{ username: string, password: string }} user
 */
export async function saveUser(user) {
  try {
    await runUsersStorage(async () => {
      const list = await readAccountsList();
      const next = dedupeByUsername([...list]);
      const idx = next.findIndex((u) => u.username === user.username);
      if (idx >= 0) {
        next[idx] = { username: user.username, password: user.password };
      } else {
        next.push({ username: user.username, password: user.password });
      }
      await writeAccountsList(next);
    });
  } catch (e) {
    console.error("saveUser", e);
  }
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ username: string, password: string } | null>}
 */
export async function findUserByCredentials(username, password) {
  try {
    return await runUsersStorage(async () => {
      const users = await readAccountsList();
      return (
        users.find(
          (u) => u.username === username && u.password === password,
        ) ?? null
      );
    });
  } catch (e) {
    console.error("findUserByCredentials", e);
    return null;
  }
}

/**
 * @param {boolean} status
 */
export async function setLoggedIn(status) {
  try {
    await AsyncStorage.setItem(KEYS.IS_LOGGED_IN, JSON.stringify(!!status));
  } catch (e) {
    console.error("setLoggedIn", e);
  }
}

export async function isLoggedIn() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.IS_LOGGED_IN);
    if (raw == null || raw === "") {
      return false;
    }
    return JSON.parse(raw) === true;
  } catch (e) {
    console.error("isLoggedIn", e);
    return false;
  }
}

export async function logout() {
  try {
    await setLoggedIn(false);
    await clearActiveUser();
  } catch (e) {
    console.error("logout", e);
  }
}

/**
 * If a session is marked logged in but `activeUser` is missing (e.g. after app update),
 * bind a single local account, or require sign-in again when several accounts exist.
 */
export async function recoverActiveUserIfNeeded() {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      return;
    }
    const active = await getActiveUser();
    if (active != null) {
      return;
    }
    const users = await getUsers();
    if (users.length === 1) {
      await setActiveUser(users[0].username);
      return;
    }
    await setLoggedIn(false);
  } catch (e) {
    console.error("recoverActiveUserIfNeeded", e);
  }
}
