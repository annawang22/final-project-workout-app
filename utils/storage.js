import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage keys used by this app:
 *
 * - accounts        — JSON array: { username, password }[] (canonical store for all accounts)
 * - user (legacy)   — migrated into `accounts` on first read, then removed (was single object or array)
 * - isLoggedIn      — boolean auth state
 * - goals           — GoalObject[] (all goals + exercises)
 * - home_exercises  — ExerciseObject[] standalone Home exercises
 * - profile         — ProfileObject (name, username, image URI)
 * - logbook         — LogbookEntry[] completed exercise history
 */

const KEYS = {
  ACCOUNTS: "accounts",
  USER: "user",
  IS_LOGGED_IN: "isLoggedIn",
  GOALS: "goals",
};

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
  return {
    id,
    text: o.text != null ? String(o.text) : "",
    exercises: Array.isArray(o.exercises) ? o.exercises : [],
    isActiveOnHome: Boolean(o.isActiveOnHome),
  };
}

function createGoalId() {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @returns {Promise<{ id: string, text: string, exercises: unknown[], isActiveOnHome: boolean }[]>}
 */
async function readGoalsFromStorage() {
  const raw = await AsyncStorage.getItem(KEYS.GOALS);
  if (raw == null || raw === "") {
    return [];
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
  await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
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
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteGoal(id) {
  try {
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
  } catch (e) {
    console.error("logout", e);
  }
}
