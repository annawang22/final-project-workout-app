# Workout App

## Features
- Login and account screen
- Goals screen
- Home screen
- Profile screen

---

## Login and account screen
Use AsyncStorage as a persistent key-value store to maintain user authentication state across app sessions. No backend is used; authentication is simulated locally.

### AsyncStorage Data Schema
Key: "user"
Value:
{
  "username": string,
  "password": string
}

Key: "isLoggedIn"
Value:
true | false

### Storage Utility Functions
Create a file: /utils/storage.js

Functions:
- saveUser(user): saves user object to AsyncStorage
- getUser(): retrieves stored user
- setLoggedIn(status): stores login state
- isLoggedIn(): returns boolean login state
- logout(): clears login state (but keeps user)

### Authentication Flow
On App Launch:
- Check AsyncStorage for "isLoggedIn"
- If true → navigate to Home screen
- If false → navigate to Login screen

On Signup:
- Save user credentials to AsyncStorage
- Set isLoggedIn = true
- Navigate to Home screen

On Login:
- Compare entered credentials with stored user
- If match:
    - set isLoggedIn = true
    - navigate to Home
- Else:
    - show error message

On Logout:
- set isLoggedIn = false
- navigate to Login screen

### Screens
LoginScreen:
- Inputs: username, password
- Button: login
- Validates credentials using AsyncStorage

SignupScreen:
- Inputs: username, password
- Button: create account
- Saves user to AsyncStorage

### Technical Requirements
- Use Expo (Expo Go compatible)
- Use functional components + React hooks
- Use @react-native-async-storage/async-storage
- Use React Navigation for screen transitions
- Do NOT use any backend or Firebase

### Edge Cases
- If no user exists in storage → force signup
- Prevent login if fields are empty
- Handle AsyncStorage errors with try/catch
- Ensure AsyncStorage calls are async/await

---

## Goals Screen
### Purpose
The Goals screen allows users to create, view, edit, and delete personal workout goals. All goals must persist locally across app sessions using AsyncStorage.

### UI Structure (Functionality First)
- Screen title: "My Goals"
- Main content area:
  - Displays a list of goals (if any exist)
  - If no goals exist, display:
    "No goals yet. Create your first workout goal to get started."
- Bottom of screen:
  - A "+" (add) button for creating a new goal
- App-wide bottom navigation bar with tabs:
  - Home
  - Goals
  - Profile/Account

### Data Model
AsyncStorage Key:
- "goals"

Stored Value Format:
```json
[
  {
    "id": "unique-id",
    "text": "Run 3 times per week"
  }
]

### Core State (GoalsScreen)
goals → array of goal objects
modalVisible → boolean (controls popup)
inputValue → string (new/edit goal text)
editingGoalId → string | null (tracks if editing)

### Core Functionality
1. Load Goals
- On screen mount:
    - Fetch goals from AsyncStorage
    - If data exists → populate goals
    - If no data → initialize as empty array
2. Add Goal
Trigger:
User presses "+" button

Behavior:
Open modal popup
Modal contains:
Text input
Save button
Cancel button

On Save:
Validate input is not empty
Create new goal object:
generate unique id
assign text from input
Add goal to goals state
Save updated goals array to AsyncStorage
Clear input field
Close modal automatically

3. Edit Goal
Trigger:
User selects a goal (click and hold)

Behavior:
Open modal popup
Pre-fill input with selected goal text
Set editingGoalId

On Save:
Validate input is not empty
Update the goal in the array matching editingGoalId
Save updated goals array to AsyncStorage
Clear editingGoalId
Clear input field
Close modal automatically

4. Delete Goal
Trigger:
User presses delete button on a goal after clicking into editing the goal

Behavior:
Remove goal from goals state
Save updated goals array to AsyncStorage
If no goals remain → show empty state message

### Edge Cases
Prevent saving empty goals
Handle AsyncStorage errors gracefully (log errors)
Ensure goals list updates immediately after any action
Ensure no crashes if AsyncStorage returns null
Allow duplicate goal text (no restriction required)
Ensure editing state does not persist incorrectly after closing modal

---

## Goal Detail + Exercises Feature
### Purpose
Allows users to manage exercises within a specific goal, including creating, editing, deleting, reordering, and scheduling recurring exercises. Exercises must persist using AsyncStorage and integrate with the Home screen.

### Navigation Behavior
- From Goals Screen:
  - Single tap on a goal → toggles dropdown showing exercises
  - Double tap on a goal → navigates to Goal Detail Screen

### Goal Detail Screen
#### UI Structure
- Top:
  - Display goal title
- Main content:
  - List of exercises for this goal
  - If no exercises:
    - Display: "Click to add exercise"
- Bottom right:
  - "+" button to add exercise
- Bottom navigation bar (same as other screens):
  - Home
  - Goals
  - Profile/Account

### Exercise Data Model
Each exercise must follow this structure:

```json
{
  "id": "unique-id",
  "name": "Bench Press",
  "sets": 3,
  "reps": 10,
  "weight": 135.5,
  "duration": "10 min",
  "repeat": {
    "frequency": "week", 
    "interval": 1,
    "daysOfWeek": ["Tuesday"],
    "startDate": "YYYY-MM-DD",
    "endType": "never" | "date",
    "endDate": "YYYY-MM-DD" | null
  }
}

### Storage Structure
key: "goals"
goal object JSON:
{
  "id": "goal-id",
  "text": "Build glutes",
  "exercises": [ExerciseObject],
  "isActiveOnHome": boolean
}

### Add exercise 
Trigger:
Press "+" button

Behavior:
Open modal popup with:
Exercise name (required, string)
Sets (integer, optional)
Reps (integer, optional)
Weight (float, optional)
Mileage/Duration (string, optional)
"Repeat" button (top right inside modal)
Cancel button
Add button

On Add:
Validate name is not empty
Create exercise object
Add to goal’s exercise list
Save updated goals array to AsyncStorage
Close modal
Reset input fields

### Repeat Configuration
Trigger:
Press "Repeat" button inside modal
Open nested UI with options:

Every:
Select frequency: day / week / month / year
On:
Select days of week (Sunday–Saturday)
Starts:
"Today" or specific date
Ends:
"Never" or specific date

Behavior:
Store repeat configuration inside exercise object
If not configured → repeat = null

### Edit exercise
Trigger:
Tap exercise OR dedicated edit button

Behavior:
Open modal with pre-filled values
Allow editing all fields including repeat

On Save:
Update exercise in array
Save to AsyncStorage

### Delete Exercise
Trigger:
Delete button on exercise

Behavior:
Remove exercise from goal
Save updated data to AsyncStorage

### Reordering Exercises
User must be able to reorder exercises within a goal
Updated order must persist in AsyncStorage

### Dropdown Behavior (Goals Screen)
Single tap on goal:
Expands dropdown showing exercises
Exercises displayed in order
Collapsible (tap again closes)

### Home Screen Integration
**Activate Goal**
Trigger:
Swipe right on goal

Behavior:
Set isActiveOnHome = true
All exercises from this goal appear on Home screen

**Deactivate Goal**
Trigger:
Swipe right again

Behavior:
Set isActiveOnHome = false
Remove exercises from Home screen

### Repeat Logic (Home Screen)
If:
Goal is active on Home
Exercise has repeat configuration
Then:
Exercise should appear on Home screen only when it matches current date

Example:
Every week on Tuesday
Starts today
Ends never

→ Exercise appears every Tuesday

### Persistence Requirements
All goals + exercises stored in AsyncStorage under "goals"
After ANY change:
Immediately update AsyncStorage
On app restart:
All goals, exercises, order, and repeat settings must persist

### Edge Cases
Prevent adding exercise with empty name
Handle AsyncStorage returning null
Handle invalid numeric inputs
Allow partial exercise data (only name required)
Ensure repeat config does not break if partially filled
Ensure dropdown + double tap do not conflict
Ensure reordering persists correctly

---

## Home Screen

### Purpose
The Home screen displays the user’s daily exercises. These include:
- Exercises from goals that are activated (via swipe on Goals screen)
- Independently added exercises (not tied to any goal)

Users can complete exercises, which removes them from the screen and stores them for future logbook use.

---

### UI Structure

- Top:
  - Display current date (formatted, e.g., "Monday, April 20")
- Main content:
  - List of exercises for the current day
  - Each exercise includes:
    - Name
    - Optional details (sets, reps, weight, duration)
    - Checkbox (for completion)
- If no exercises remain:
  - Display:
    "YAY you finished all exercises for the day"
- Bottom right:
  - "+" button to add a new exercise
- Bottom navigation bar:
  - Home
  - Goals
  - Profile/Account

---

### Exercise Sources

Home screen exercises come from:

1. Active Goals:
   - Goals where `isActiveOnHome = true`
   - Include exercises that match today's date (based on repeat rules)

2. Standalone Exercises:
   - Exercises created directly on Home screen
   - Not tied to any goal
   - Always shown until completed

---

### Data Model (Home Exercises)

Home screen should combine:

- Goal-based exercises (derived dynamically)
- Standalone exercises (stored separately)

Standalone AsyncStorage key:
- "home_exercises"

Structure:
```json
[
  {
    "id": "unique-id",
    "name": "Push Ups",
    "sets": 3,
    "reps": 15,
    "weight": null,
    "duration": null,
    "completed": false
  }
]

### Add Exercise (Standalone)
Trigger:
Press "+" button on Home screen

Behavior:
Open modal (same as Goal exercise modal)
Fields:
Name (required)
Sets (optional)
Reps (optional)
Weight (optional)
Duration (optional)

On Add:
Validate name is not empty
Create exercise object
Add to "home_exercises" storage
Save to AsyncStorage
Close modal

IMPORTANT:
These exercises are NOT tied to any goal
They must persist even if all goals are deselected

### Exercise Completion
Trigger:
User taps checkbox

Behavior:
Show checkmark
Visually grey out the exercise
Remove exercise from visible list after short delay
Move exercise to "logbook" storage (future feature)

After removal:
If no exercises remain:
    Show "YAY you finished all exercises for the day"

### Goal Toggle Interaction
From Goals screen:
When a goal is activated:
    Its exercises appear on Home screen
When a goal is deactivated:
    Its exercises are removed from Home screen

IMPORTANT:
Standalone Home exercises must NOT be removed when goals are toggled 

### Repeat Logic
For goal-based exercises:
Only show exercises if they match today's date
Use repeat configuration:
    frequency (day/week/month/year)
    daysOfWeek
    startDate
    end condition

Example:
Every week on Tuesday → show only on Tuesdays

Persistence Requirements
Use AsyncStorage:
    "goals" (includes goal exercises)
    "home_exercises" (standalone)
After ANY update:
    Immediately save changes
On app restart:
    Restore all exercises correctly

### Edge Cases
Prevent empty exercise name
Handle AsyncStorage returning null
Ensure completed exercises are removed correctly
Ensure no duplication between goal + standalone exercises
Ensure goals toggling does not affect standalone exercises
Ensure repeat logic does not break if missing fields

---

## Profile / Account Screen
### Purpose
The Profile screen allows users to view and edit personal information, access the logbook of completed exercises, and log out of the app.

### UI Structure
- Top:
  - Text: "Welcome [User Name]"
- Profile section:
  - Profile picture (editable)
  - Name (editable, default placeholder: "Your Name")
  - Username (displayed below name)

- Actions section:
  - "Logbook" button
  - "Logout" button

- Bottom navigation bar:
  - Home
  - Goals
  - Profile/Account

### Profile Data
Stored using AsyncStorage.
Key:
- "profile"

Structure:
```json
{
  "name": "Your Name",
  "username": "username",
  "profileImage": "uri-or-null"
}

### Profile Editing
Name
    Default: "Your Name"
    User can edit and save
    Updates AsyncStorage immediately
Profile Picture
    User can select or change profile picture
    Store URI in AsyncStorage
    Display selected image on Profile screen

### Logbook Navigation
Trigger:
User taps "Logbook"

Behavior:
Navigate to Logbook Screen

### Logbook Screen
UI Structure
Top:
    Back arrow (returns to Profile screen)
    Title: "Logbook"
Below:
    List grouped by date (most recent first)

Each section:
Date (e.g., "April 20, 2026")
List of completed exercises for that date

If no exercises exist:
Show empty state (optional, or leave blank)

### Logbook Data
Stored using AsyncStorage.
Key:
"logbook"

Structure:
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

### Exercise Display (Logbook)
Each exercise:
    Shows name + optional details
    Has a checked checkbox (✓)
    Is visually greyed out

### Undo Completion (Critical Feature)
Trigger:
User taps checkbox on a completed exercise in Logbook

Behavior:
Remove exercise from logbook for that date
Re-add exercise to Home screen
Exercise appears as NOT completed

Rules:
Exercise should return to today's Home list
Must persist correctly in AsyncStorage

### Persistence Requirements
Logbook must persist using AsyncStorage
When an exercise is completed on Home screen:
    It is removed from Home
    It is added to logbook under today's date
On app restart:
    Logbook must remain intact

### Logout Behavior
Trigger:
    User taps "Logout"
Behavior:
    Keep all data in AsyncStorage (do NOT delete anything)
    Set login state to false
    Navigate back to Login screen

### State Requirements
Profile Screen:
name
username
profileImage

Logbook Screen:
logbookEntries (grouped by date)

### Edge Cases
Handle AsyncStorage returning null
Prevent blank name updates
Handle missing profile image
Ensure logbook updates immediately after completion
Ensure undo action restores exercise correctly
Ensure no duplicate entries in logbook
Ensure proper date grouping