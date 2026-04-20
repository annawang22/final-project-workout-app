import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage keys used by this app:
 *
 * - user           — { username, password } stored credentials
 * - isLoggedIn     — boolean auth state
 * - goals          — GoalObject[] (all goals + exercises)
 * - home_exercises — ExerciseObject[] standalone Home exercises
 * - profile        — ProfileObject (name, username, image URI)
 * - logbook        — LogbookEntry[] completed exercise history
 */

const KEYS = {
  USER: "user",
  IS_LOGGED_IN: "isLoggedIn",
};

/**
 * @param {{ username: string, password: string }} user
 */
export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error("saveUser", e);
  }
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    if (raw == null || raw === "") {
      return null;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("getUser", e);
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
    await AsyncStorage.removeItem(KEYS.IS_LOGGED_IN);
  } catch (e) {
    console.error("logout", e);
  }
}
