# Workout App — Spec & Build Phases

---

## Architecture Overview

**Platform:** React Native with Expo (Expo Go compatible)  
**Navigation:** React Navigation (bottom tab + stack)  
**Persistence:** `@react-native-async-storage/async-storage` (no backend)  
**Components:** Functional components + React hooks throughout

### AsyncStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `user` | `{ username, password }` | Stored credentials |
| `isLoggedIn` | `boolean` | Auth state |
| `goals` | `GoalObject[]` | All goals + exercises |
| `home_exercises` | `ExerciseObject[]` | Standalone Home exercises |
| `profile` | `ProfileObject` | Name, username, image URI |
| `logbook` | `LogbookEntry[]` | Completed exercise history |

### Storage Utility — `/utils/storage.js`

Centralize all AsyncStorage access here. No screen should call AsyncStorage directly.

```js
saveUser(user)       // saves { username, password }
getUser()            // retrieves stored user
setLoggedIn(status)  // stores boolean login state
isLoggedIn()         // returns boolean
logout()             // clears isLoggedIn (keeps user)
```

All functions must be `async/await` and wrapped in `try/catch`.

---

## Phase 0 — Foundation

**Goal:** Expo app boots cleanly, navigation shell exists, storage layer is wired up.

### Tasks
- Initialize Expo project (Expo Go compatible)
- Install and configure React Navigation
- Install `@react-native-async-storage/async-storage`
- Create `/utils/storage.js` with all utility functions
- Build bottom tab navigator shell with placeholder screens: Home, Goals, Profile
- Verify AsyncStorage reads and writes in a test utility
- Add code comments documenting the gesture model (single tap / double tap / swipe) before any gesture code is written

### Done When
- [ ] App opens in Expo Go with no red screens or import errors
- [ ] React Navigation renders the three placeholder tabs
- [ ] AsyncStorage writes and reads without crashing when empty
- [ ] `/utils/storage.js` exists and exports all utility functions
- [ ] All six storage keys are documented in comments or a README
- [ ] App reload does not crash on empty/null AsyncStorage

---

## Phase 1 — Login & Signup

**Goal:** Users can create an account, log in, stay logged in across app restarts, and log out.

### Screens

**LoginScreen**
- Inputs: username, password
- Buttons: Login, (link to) Sign Up
- Validates credentials against AsyncStorage

**SignupScreen**
- Inputs: username, password
- Button: Create Account
- Saves user to AsyncStorage, sets `isLoggedIn = true`, navigates to Home

### Auth Flow

| Trigger | Behavior |
|---------|----------|
| App launch | Check `isLoggedIn` → Home if true, Login if false |
| No user in storage | Force signup screen |
| Signup | Save `{ username, password }`, set `isLoggedIn = true`, go Home |
| Login | Match credentials → set `isLoggedIn = true`, go Home; else show error |
| Logout | Set `isLoggedIn = false`, navigate to Login (keep all other data) |

### Edge Cases
- Block login/signup if any field is empty
- Show clear error message on invalid credentials
- All AsyncStorage calls wrapped in `try/catch`

### Done When
- [ ] No stored user → forced into signup
- [ ] Signup saves credentials and navigates to Home
- [ ] Login validates against stored credentials
- [ ] Empty fields blocked on both screens
- [ ] Wrong credentials show error, do not navigate
- [ ] App relaunch lands on correct screen based on `isLoggedIn`
- [ ] Logout sets `isLoggedIn = false` without deleting other data
- [ ] Kill-and-reopen preserves correct auth state

---

## Phase 2 — Goals Screen (CRUD)

**Goal:** Users can create, view, edit, delete, and persist goals.

### UI Structure
- Screen title: "My Goals"
- Empty state: `"No goals yet. Create your first workout goal to get started."`
- "+" button opens add-goal modal
- Each goal row: goal text + edit/delete actions
- Bottom navigation bar: Home | Goals | Profile

### Goal Data Model — stored under key `"goals"`

```json
[
  {
    "id": "unique-id",
    "text": "Run 3 times per week",
    "exercises": [],
    "isActiveOnHome": false
  }
]
```

### Core State
| State | Type | Purpose |
|-------|------|---------|
| `goals` | `GoalObject[]` | Full goals list |
| `modalVisible` | `boolean` | Controls modal popup |
| `inputValue` | `string` | Add/edit text field |
| `editingGoalId` | `string \| null` | Tracks edit mode |

### Core Actions

**Add Goal**
- Press "+" → open modal with text input, Save, Cancel
- Validate: non-empty input
- On Save: generate unique ID, append to array, save to AsyncStorage, close modal, reset input

**Edit Goal**
- Long press on goal row → open modal pre-filled with goal text
- On Save: update matching entry, save to AsyncStorage, reset state

**Delete Goal**
- Accessible from the edit modal
- Remove from array, save to AsyncStorage

### Edge Cases
- Prevent saving empty goal text
- Duplicate goal text is allowed
- Modal input always resets after cancel or save
- Editing state must not persist after modal closes

### Done When
- [ ] "My Goals" title renders
- [ ] Empty state message appears when no goals
- [ ] "+" opens modal; goal saves and appears in list
- [ ] Edit works and pre-fills existing text
- [ ] Delete removes goal from list and storage
- [ ] Empty goals cannot be saved
- [ ] Goal list updates immediately after any action
- [ ] Goals persist after kill-and-reopen
- [ ] Bottom navigation works without breaking state

---

## Phase 3 — Goal Detail & Exercise CRUD

**Goal:** Each goal can own exercises; exercises persist and are editable.

### Navigation
- **Single tap** on a goal → expand/collapse exercise dropdown (inline)
- **Double tap** on a goal → navigate to Goal Detail Screen
- These gestures must not conflict — document handling in code comments before implementation

### Goal Detail Screen

**UI Structure**
- Top: goal title
- Main: list of exercises for this goal
- Empty state: `"Click to add exercise"`
- Bottom right: "+" button
- Bottom nav: Home | Goals | Profile

### Exercise Data Model

```json
{
  "id": "unique-id",
  "name": "Bench Press",
  "sets": 3,
  "reps": 10,
  "weight": 135.5,
  "duration": "10 min",
  "repeat": null
}
```

`repeat` is `null` when not configured. See Phase 4 for the repeat schema.

### Core Actions

**Add Exercise**
- Press "+" → modal with: Name (required), Sets, Reps, Weight, Duration (all optional), Repeat button, Add, Cancel
- Validate: name not empty
- On Add: create exercise object, push to goal's `exercises` array, save `"goals"` to AsyncStorage

**Edit Exercise**
- Tap exercise or edit button → modal pre-filled with values
- On Save: update in array, save to AsyncStorage

**Delete Exercise**
- Delete button on exercise
- Remove from array, save to AsyncStorage

**Reorder Exercises**
- User can drag to reorder
- Persists updated order to AsyncStorage

### Edge Cases
- Name is the only required field
- Invalid numeric inputs must not crash
- Editing state must not bleed between exercises

### Done When
- [ ] Double tap opens Goal Detail screen with correct title
- [ ] Empty state shows "Click to add exercise"
- [ ] "+" opens add modal; exercise saves and appears
- [ ] Edit pre-fills and saves correctly
- [ ] Delete works and persists
- [ ] Invalid numbers do not crash
- [ ] Reordering persists after restart
- [ ] Single-tap dropdown still works and does not conflict with double tap

---

## Phase 4 — Repeat Rules

**Goal:** Exercises can be configured to recur on a schedule.

### Repeat Schema

```json
{
  "frequency": "week",
  "interval": 1,
  "daysOfWeek": ["Tuesday"],
  "startDate": "YYYY-MM-DD",
  "endType": "never",
  "endDate": null
}
```

`endType` is either `"never"` or `"date"`. When `"date"`, `endDate` is a `"YYYY-MM-DD"` string.

### Repeat Configuration UI
Accessible via "Repeat" button inside the add/edit exercise modal.

| Field | Options |
|-------|---------|
| Every | day / week / month / year |
| On | Days of week (Sun–Sat), shown when frequency is "week" |
| Starts | "Today" or specific date picker |
| Ends | "Never" or specific date picker |

If user does not configure repeat → `repeat = null` on exercise object.

### Edge Cases
- Missing or partial repeat config must not crash
- Editing an exercise preserves its repeat settings
- `repeat = null` exercises are treated as non-recurring

### Done When
- [ ] Repeat button appears in add/edit modal
- [ ] All four fields configurable
- [ ] Repeat config saves inside exercise object
- [ ] Editing updates repeat settings correctly
- [ ] Null repeat does not cause errors
- [ ] Repeat config survives app restart
- [ ] Manual tests pass:
  - Every week on Tuesday, starts today, ends never
  - No repeat
  - Repeat ending on a specific date

---

## Phase 5 — Goal Activation (Goals ↔ Home)

**Goal:** Goals can be activated to surface their exercises on the Home screen.

### Gesture Summary (Goals Screen)

| Gesture | Action |
|---------|--------|
| Single tap | Expand/collapse exercise dropdown |
| Double tap | Navigate to Goal Detail Screen |
| Swipe right | Toggle `isActiveOnHome` |

All three gestures must be stable and must not trigger each other.

### Activation Behavior
- **Swipe right** on a goal → `isActiveOnHome = true` → eligible exercises appear on Home
- **Swipe right again** → `isActiveOnHome = false` → that goal's exercises removed from Home
- Standalone Home exercises are never affected by goal toggling
- Activation state persists to AsyncStorage

### Dropdown Behavior (Single Tap)
- Expands to show exercises in saved order
- Collapsible on second tap
- Exercises shown in collapsed preview are read-only

### Done When
- [ ] Single tap expands/collapses exercise list
- [ ] Dropdown shows exercises in saved order
- [ ] Swipe right toggles activation visually
- [ ] Active goal's exercises appear on Home
- [ ] Deactivating removes only that goal's exercises
- [ ] Activation state persists after restart
- [ ] Standalone Home exercises unaffected by toggling
- [ ] No gesture conflicts

---

## Phase 6 — Home Screen

**Goal:** Home screen shows today's exercises from both active goals and standalone additions.

### UI Structure
- Top: current date (e.g., `"Monday, April 20"`)
- Main: combined exercise list (goal-based + standalone)
- Each row: name + optional details (sets, reps, weight, duration) + checkbox
- Empty state: `"YAY you finished all exercises for the day"`
- Bottom right: "+" button
- Bottom nav: Home | Goals | Profile

### Exercise Sources

**Goal-based exercises**
- From goals where `isActiveOnHome = true`
- Only shown when they match today's date via repeat rules (see Phase 4)

**Standalone exercises**
- Added directly on Home screen
- Stored under `"home_exercises"`
- Not tied to any goal
- Always shown until completed

### Add Standalone Exercise
- Press "+" → same modal as Goal exercise (Name required, rest optional)
- No repeat option needed for standalone exercises
- Saved to `"home_exercises"` in AsyncStorage

### Repeat Logic
For goal-based exercises with a repeat config, show on Home only when today matches the rule:

```
frequency: week, daysOfWeek: ["Tuesday"] → show only on Tuesdays
startDate must have passed, endDate (if set) must not have passed
```

If repeat is null → show every day the goal is active.

### Edge Cases
- No duplicate rendering between goal and standalone sources
- Deactivating a goal never removes standalone exercises
- Prevent empty exercise name
- Handle null AsyncStorage gracefully

### Done When
- [ ] Today's date renders at top
- [ ] Goal-based exercises appear when goal is active + date matches
- [ ] Standalone exercises appear and persist independently
- [ ] "+" adds to `"home_exercises"`, not to any goal
- [ ] Deactivating goal removes only goal exercises
- [ ] Empty state shows "YAY you finished all exercises for the day"
- [ ] No duplication between sources
- [ ] All data restores after restart

---

## Phase 7 — Exercise Completion & Logbook Write

**Goal:** Checking off an exercise removes it from Home and writes it to the logbook.

### Completion Flow
1. User taps checkbox on a Home exercise
2. Checkmark appears; exercise greys out
3. After a short delay (~500ms), exercise is removed from the visible list
4. Exercise is written into `"logbook"` under today's date
5. If no exercises remain → show empty state

### Logbook Data Model — key `"logbook"`

```json
[
  {
    "date": "YYYY-MM-DD",
    "exercises": [
      {
        "id": "exercise-id",
        "name": "Push Ups",
        "sets": 3,
        "reps": 15,
        "weight": null,
        "duration": null
      }
    ]
  }
]
```

### Edge Cases
- No exercise should be silently lost — every completed item must be in logbook storage
- Completion state persists after restart
- Handle null logbook storage on first completion

### Done When
- [ ] Checkbox shows checkmark on tap
- [ ] Exercise greys out before disappearing
- [ ] Exercise removed from Home after delay
- [ ] Exercise written to logbook under today's date
- [ ] Last completion triggers empty state
- [ ] Completion persists after restart
- [ ] Every completed item retrievable from logbook storage

---

## Phase 8 — Profile Screen

**Goal:** Users can view and edit their profile and access the logbook.

### UI Structure
- Top: `"Welcome [User Name]"`
- Profile section: profile picture (editable), name (editable), username (display only)
- Actions: Logbook button, Logout button
- Bottom nav: Home | Goals | Profile

### Profile Data Model — key `"profile"`

```json
{
  "name": "Your Name",
  "username": "username",
  "profileImage": "uri-or-null"
}
```

### Profile Editing
- **Name:** editable inline; updates AsyncStorage on save; default is `"Your Name"`
- **Profile picture:** opens image picker; stores URI; displays on screen

### Logout
- Sets `isLoggedIn = false`
- Navigates to Login
- Does NOT delete goals, exercises, profile, or logbook data

### Edge Cases
- Prevent saving blank name
- Handle missing profile image gracefully
- Username is display-only (not editable)

### Done When
- [ ] Profile tab loads without errors
- [ ] `"Welcome [username]"` displays correctly
- [ ] Name defaults to "Your Name" and is editable
- [ ] Username shown below name
- [ ] Profile picture can be set and persists
- [ ] Profile data persists after restart
- [ ] Logbook button navigates to Logbook screen
- [ ] Logout returns to Login, all other data preserved

---

## Phase 9 — Logbook Screen & Undo

**Goal:** Completed exercises can be reviewed and restored to the Home screen.

### UI Structure
- Back arrow → returns to Profile
- Title: `"Logbook"`
- Entries grouped by date, most recent first
- Each exercise: name + details, greyed out with checked checkbox

### Undo Completion

| Trigger | Behavior |
|---------|----------|
| Tap checked exercise in Logbook | Remove from logbook for that date |
| | Re-add to today's Home list as incomplete |

Restored exercise must persist as incomplete in `"home_exercises"` after app restart.

### Edge Cases
- No duplicate logbook entries after repeated complete/undo cycles
- Home and logbook stay in sync after restore
- Empty date groups do not render
- Undo restores correctly after restart

### Done When
- [ ] Logbook opens from Profile and back arrow works
- [ ] Entries grouped by date, most recent first
- [ ] Exercises shown greyed out with checked state
- [ ] Tapping exercise removes it from logbook
- [ ] Exercise re-appears on Home as incomplete
- [ ] Undo persists after restart
- [ ] No duplicate entries after complete/undo cycles

---

## Phase 10 — Regression Gate

**Goal:** The full app works end-to-end before any UI polish begins.

### Critical Paths to Verify Manually

**Fresh install path**
Signup → create goal → add exercise → activate goal → see exercise on Home

**Standalone exercise path**
Add exercise on Home → persists → not affected by goal toggling

**Completion path**
Home → tap checkbox → exercise removed → appears in logbook

**Undo path**
Logbook → tap exercise → removed from logbook → back on Home as incomplete

**Profile path**
Edit name → change picture → restart → changes persist

**Logout/login cycle**
Logout → log back in → goals, exercises, home exercises, profile, logbook all intact

**Kill-and-reopen**
Test from every major screen: Home, Goals, Goal Detail, Profile, Logbook

### Done When
- [ ] All six paths above pass
- [ ] No screen crashes on empty AsyncStorage
- [ ] No gesture conflicts on Goals screen
- [ ] No known open bugs remain from any prior phase
- [ ] Empty states render correctly on every screen
