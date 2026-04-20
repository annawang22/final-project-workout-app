## AI Used: ChatGPT Pro, Cursor Pro, Claude AI (April 2026 version)

## ChatGPT Pro Prompts used to create SPEC.md:
1) im trying to create my own workout app using expo go. i am currently writing a spec.md to agentically build my app. i want to have a login and account screen. i want to use asyncstorage. could you provide me on what i should provide a model about using asyncstorage for this project? 
2) okay now let me explain to you another screen i want to add to my app. im writing this for my SPEC.md, functionality comes before UI. i want to have a goals page. at the top of the screen, it should say "My Goals" and then when there are no goals, it should say "No goals yet. Create your first workout goal to get started." There should be a plus button at the bottom that allows me to add a goal. There should be a navigation bar at the bottom that allows you to move from home screen, goal screen, and profile/account screen. when you add a goal, kill the app completely reopen and the goal should still be there. oh yeah let me preface, im using cursor pro as my agentic process. when you press the add button, there should be a pop up thaqt allows you to write a goal that you want. 
    A few things I’d recommend you specify too, because Cursor may otherwise invent behavior:
        whether goals can be deleted
        whether goals can be edited
        whether the popup closes automatically after save
        whether duplicate goals are allowed
    If you want, I can turn this into a more polished full spec section that matches the same style as the login/account part.
3) yes to all of these and provide me a full spec section. 
4) can you give something that i can copy and paste into my SPEC.md
5) okay now i want to build upon this, help me write another spec section for this feature. once there is a goal, if you double click the goal. you should be brought to another screen where it has the goal at the top of the page. and then if there are no exercises yet, it should say "click to add exercise".  again, the navigation bar should be at the bottom same as the goals page. similarly to the goal page, there should be a a plus button at the bottom right of the screen.  instead of adding goal, if you click on it, there should be a pop up that allows you to add exercise. There should be a box for you to write the exercise name (string), and then below optional boxes of sets (integer), reps (integer), weight (float), milage/duration (string). cancel and add buttons.  there is also an option at the top right corner that allows you to repeat a specific exercise if you want to. if you click repeat there are options that allows you to set the repeat occurances of the exercise, so Every _____ (scrollable options: day, week, month, year), On ____ select options (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday), Starts ____ (date or Today), ends ____ (never, date). once you add the exercise, you can edit it still or delete it. when you kill the app completely, the exercise should still be there. once you add the exericise, it should appear on that screen in which if there are other exercises you can reorganize the order of the exercises and if you return to goals page, and click once on the goal, the exercises should appear as a drop down. if you want to edit the exercses, double click the goal and then you can edit the exercises. on the goal page, if you swipe right on a goal, those exercises will appear on the home screen. and if you swipe right, it removes all the exercises from the homescreen. this should be obvious to you. also when you set the exericse to repeat and you have swiped right for the goal, for example every week on Tuesday, starts today, ends never. every tuesday, that exercise should appear on the homescreen every week on Tuesday. i have attached rough sketches of what i want. it doesn't have to be identical, but it shouldn't deviate too much from my original idea.
provided images: 
- https://drive.google.com/file/d/13U2hfXUL-wJMk4wCARxQojgjf0QvTo1_/view?usp=sharing
- https://drive.google.com/file/d/1vudwmzC5xOvIPjqFIijURdAx6GufqADT/view?usp=sharing
- https://drive.google.com/file/d/1FTzJKC82MzvSzzA7d7I_4H65ZWxq71LX/view?usp=sharing
6) okay now write me a section for my spec on the home page. i want the date to be at the top of the screen. there should be a plus button at the bottom again, similar to the goals page. When a goal is selected and the exercises appear on the homescreen, the exercises should have checkoff boxes so that when you do the exercise you can check it off after you do it and to be more specific when you click the checkoff box, a check mark should appear and the exercise should grey out and then vanish  into a “logbook” which i will expand on later. And the homescreen just says “YAY you finished all exercises for the day”. Also, similar to the other pages on the screen, there is a plus button at the bottom right of the home screen that allows you add an exercise in (so same functionality as when you would add a new exercise to a goal). However, this exercise isn’t added to the goal. To be more specific, if you add this exercise and then go to the goals page and deselect the goal, the exercises under the goal should be removed from the homescreen, but that one exercise that you just added to the homescreen should still be there. 
7) Okay now write me a section for my spec on the profile/account page. Navigation bar should be at the bottom still. The top should say “Welcome Your Name”. There is place for for you to change your profile picture. Next to your profile picture, there is you name and username under. “Your name” should be a placeholder and then you can change it to whatever. Below, there two things: logbook and logout. If you click logbook, it will open another page that has the navigation bar at the bottom, a back arrow to return to the profile page and there should be the date underneath the dates, it should be all the checked off exercises you checked off and then under that should be the date before and then the list of exercises that were check off that day. If there are none, then there doesn’t need to be anything. These exercises should be checked off with a check mark and greyed out like how they were on the homepage before they were logged into the logbook. The point of this is so that if you for example, accidentally checked off something you didn’t finish, you can click on the checkoff box and then it will reappear on your homescreen again. As for the logout button, if it is clicked, everything is saved and you return back to the login page. 
8) Provided the current SPEC.md. This is my current spec. i want to create phases to help with my agentic build in cursor. i want to make sure that we don't move to another phase until the phase is fully functional with no bugs. could you create crititeria for each phase that have to be checked off in order to move to the next phase?

## Claude AI:
1) Provided current SPEC.md and ChatGPT response (https://docs.google.com/document/d/1LkCbe29DhRDEaVH5jZEEpWUCbLcUS5nknjGps3-oUto/edit?usp=sharing), could you help me rewrite my SPEC.md? i want make sure that when i build my workout app agentically, that we go through phases.
2) write me the first prompt i should provide cursor to start my agentic build. i want to make sure after each phase, we kill the app and make sure everything is still there and all functionality still works.

## Cursor Pro (AGENT):
1) You are building a React Native workout app using Expo (Expo Go compatible). All work must follow the SPEC.md in this project. Never skip ahead to a future phase. Never leave a phase incomplete to move on. Read SPEC.md in full before writing any code.
We are starting Phase 0. Your job is to complete every task in Phase 0 and verify every item in the "Done When" checklist before stopping.
Build the following:
Initialize a new Expo project that works in Expo Go. Use React Navigation with a bottom tab navigator that has three placeholder screens: Home, Goals, and Profile. Each screen should just render its name as centered text for now.


Install all required dependencies: @react-native-async-storage/async-storage, @react-navigation/native, @react-navigation/bottom-tabs, and any required Expo peer dependencies.


Create /utils/storage.js with these exported async functions, all wrapped in try/catch:


saveUser(user)
getUser()
setLoggedIn(status)
isLoggedIn()
logout()
At the top of /utils/storage.js, add a comment block documenting all six storage keys: user, isLoggedIn, goals, home_exercises, profile, logbook.


Add a comment block in the Goals screen file (even though it's a placeholder) documenting the three gesture behaviors before any gesture code exists:


Single tap → expand/collapse exercise dropdown
Double tap → navigate to Goal Detail screen
Swipe right → toggle isActiveOnHome
Verify AsyncStorage works by calling getUser() on app launch and logging the result. It must not crash when storage is empty.


When you are done, go through the Phase 0 "Done When" checklist in SPEC.md item by item and confirm each one passes. Then stop and tell me:
What you built
Any decisions you made that weren't specified
Anything that needs my input before Phase 1
Do not start Phase 1.
After you respond, I will kill the app completely, reopen it in Expo Go, and manually verify everything still works before we proceed.

## NEW CHAT CURSOR PRO (ASK):
1) is this " ERROR  getUser [AsyncStorageError: Native module is null, cannot access legacy storage]
 LOG  [storage] getUser on launch: null" ok to have in the current Phase 0? 

## RETURNED TO OLD AGENT CURSOR PRO CHAT
2) I am currently receiving this error:  ERROR  getUser [AsyncStorageError: Native module is null, cannot access legacy storage]
 LOG  [storage] getUser on launch: null. please fix this. 

## RETURNED TO OLD CLAUDE CHAT:
3) write me the next prompt for phase 1

## RETURN TO CURSOR PRO (AGENT)
3) Phase 0 is complete and verified. We are now starting Phase 1.
Read SPEC.md and review the Phase 1 section in full before writing any code.
Your job is to complete every task in Phase 1 and verify every item in the "Done When" checklist before stopping. Do not start Phase 2.
Build the following:
Auth check on app launch. Before rendering any navigation, check isLoggedIn() from /utils/storage.js. If true, navigate to Home. If false, navigate to Login. If no user exists in storage at all, force the Signup screen.


LoginScreen. Two inputs: username and password. A Login button. A link or button to navigate to Signup. On Login: block submission if either field is empty and show an inline error message. Compare entered credentials against the stored user from getUser(). If they match, call setLoggedIn(true) and navigate to Home. If they don't match, show an error message and do not navigate. Never clear the username field on a failed login.


SignupScreen. Two inputs: username and password. A Create Account button. On signup: block submission if either field is empty. Call saveUser({ username, password }), then setLoggedIn(true), then navigate to Home.


Logout. Add a temporary Logout button to the Profile placeholder screen for now. On tap: call logout() from /utils/storage.js (which sets isLoggedIn to false without deleting the user), then navigate to Login.


All AsyncStorage calls must go through /utils/storage.js. No screen should call AsyncStorage directly.


When you are done, go through the Phase 1 "Done When" checklist in SPEC.md item by item and confirm each one passes. Then stop and tell me:
What you built
Any decisions you made that weren't specified
Anything that needs my input before Phase 2
Do not start Phase 2.
After you respond, I will run the following kill-and-reopen tests manually before we proceed:
Sign up as a new user → kill app → reopen → should land on Home
Log out → kill app → reopen → should land on Login
Log in → kill app → reopen → should land on Home
Attempt login with wrong password → should show error, stay on Login
Attempt login with empty fields → should show error, stay on Login
Delete the app / clear storage → reopen → should land on Signup

4) currently, only one username and password is being saved at a time. to be more specific, when i create 2 accounts. only one of them is stored. the other one suddenly doesn't work anymore. first, explain to me what you understood from what i have said about the problem. once i agree with you that this is the correct issue, i will prompt you to fix this.
5) okay yes, we agree on the same issue. please fix this issue by allowing multiple users in storage. 
6) this still hasn't fixed the issue. the second user is still the only one saved. explain to me how you are going to approach fixing this different before starting. i will prompt you to fix again if i think your approach is good.
7) proceed with implementation
8) i restarted with npx expo start -c and the problem still holds. im confused on why this is happening, could you explain to me what files are causing this issue before doing any more 
9) ok tell me what you are going to do differently to address this issue. i will tell you to proceed if i like what you have proposed.
10) okay try this implementation.

## NEW CHAT IN CHATGPT PRO
1) Provided SPEC.md. this is my current spec. (Gave it my conversation with Claude about providing me prompts for each phase). Similarly can you write me my third prompt, make it similar to how Claude does it.

## RETURNED TO CURSOR PRO (AGENT)
11) Phase 1 is complete and verified. We are now starting Phase 2.
Read SPEC.md and review the Phase 2 section in full before writing any code.
Your job is to complete every task in Phase 2 and verify every item in the "Done When" checklist before stopping. Do not start Phase 3.
Build the following:
Goals screen UI. Replace the placeholder Goals screen with a real screen titled "My Goals". Keep bottom navigation working as-is. When there are no goals, show this exact empty state message:
"No goals yet. Create your first workout goal to get started."
Persist goals in AsyncStorage. Use the existing centralized storage approach. Do not call AsyncStorage directly from the screen. Add whatever goal storage helpers are needed in /utils/storage.js so the Goals screen can load and save goals through that file only.
Goal data model. Store goals under the goals key using this shape:
{
  id: "unique-id",
  text: "Run 3 times per week",
  exercises: [],
  isActiveOnHome: false
}


Add Goal flow. Add a visible "+" button that opens a modal. The modal should include:
text input for the goal
Save button
Cancel button
On Save:
block empty input
generate a unique ID
create the new goal object
append it to the goals array
save to AsyncStorage
close the modal
reset the input state
Edit Goal flow. Support editing an existing goal by long pressing a goal row. This should open the same modal with the current goal text pre-filled. On Save:
update the matching goal
preserve its other properties (id, exercises, isActiveOnHome)
save to AsyncStorage
close the modal
reset edit state and input state
Delete Goal flow. Make delete available from the edit modal. Deleting should:
remove the selected goal from the array
save the updated array to AsyncStorage
close the modal
reset input and editing state
Validation and state reset rules.
Empty goals cannot be saved
Duplicate goal text is allowed
Modal input must reset after Cancel or Save
Editing state must not persist after the modal closes
Load persisted goals on screen mount / app reopen. The Goals screen must load saved goals from storage and render them correctly after killing and reopening the app.
When you are done, go through the Phase 2 "Done When" checklist in SPEC.md item by item and confirm each one passes. Then stop and tell me:
What you built
Any decisions you made that weren't specified
Anything that needs my input before Phase 3
Do not start Phase 3.
After you respond, I will run the following kill-and-reopen tests manually before we proceed:
Open Goals with no saved goals → should show the empty state
Add a new goal → kill app → reopen → goal should still be there
Edit an existing goal → kill app → reopen → edited text should persist
Delete a goal → kill app → reopen → deleted goal should stay deleted
Try saving an empty goal → should be blocked
Cancel out of the modal → reopening the modal should not keep stale input or edit state
Bottom navigation should keep working throughout without breaking saved state
12)  i found an issue in which when a user creates a goal in their account. it appears in the other users accounts too. this isn't supposed to happen. all data for each user should be separate and shouldn't be seen by another. this is to make sure everything is secure. please repeat back to me what the issue. i will ask you to fix this if i agree with your interpretation of the problem
13) yes that is exactly the problem. please fix this. and explain to me what you changed

## RETURNED TO CHATGPT PRO CHAT ABOUT PROMPTING
2) can you write phase 3 prompt
3) can you also add in that i want to make sure that all information is stored separately for each user. user A cannot see User B's information (goals/exercises/all).

## RETURNED TO CURSOR PRO (AGENT)
14) Phase 2 is complete and verified. We are now starting Phase 3.
Read SPEC.md and review the Phase 3 section in full before writing any code.
Your job is to complete every task in Phase 3 and verify every item in the "Done When" checklist before stopping. Do not start Phase 4.

🚨 CRITICAL GLOBAL REQUIREMENT (APPLIES TO ALL WORK IN THIS PHASE)
All user data must be fully isolated per user.
A user must only see their own data
No data leakage between users is allowed
This includes:
goals
exercises
(and any future data tied to goals)
Implementation requirement:
You must scope all stored data by username.
For example:
Instead of storing under "goals"
Store under something like:
"goals_<username>"
The same rule must apply whenever goals are read or written.
⚠️ You must:
Update /utils/storage.js if needed to support user-scoped storage
Ensure all reads/writes use the currently logged-in user
Never access shared/global goal data

1. Goal Detail Navigation (Double Tap)
Implement double tap on a goal row in the Goals screen to navigate to a new Goal Detail Screen
Pass the full goal object (or goal ID) to the screen
The Goal Detail screen must display the goal title at the top
⚠️ Before implementing gestures, add a comment block in the Goals screen explaining how you will prevent conflicts between:
Single tap (expand/collapse)
Double tap (navigation)
Do not skip this — document the approach first.

2. Single Tap Dropdown (Inline Exercises Preview)
Implement single tap on a goal row to expand/collapse a dropdown
When expanded:
Show that goal’s exercises
Display them in saved order
This is a read-only preview (no editing here)
Tapping again should collapse the dropdown

3. Goal Detail Screen UI
Create a new screen with:
Top: goal title
Main: list of exercises for that goal
Empty state:
"Click to add exercise"
Bottom-right: "+" button
Bottom nav must continue working

4. Exercise Data Model
{
  id: "unique-id",
  name: "Bench Press",
  sets: 3,
  reps: 10,
  weight: 135.5,
  duration: "10 min",
  repeat: null
}

name is required
other fields optional
repeat must default to null

5. Add Exercise Flow
Modal includes:
Name (required)
Sets
Reps
Weight
Duration
Repeat button (placeholder only)
Add / Cancel
On Add:
Block empty name
Create exercise with unique ID
Append to correct goal’s exercises
Save using user-scoped storage
Close modal
Reset state

6. Edit Exercise Flow
Open modal pre-filled
On Save:
Update correct exercise
Persist using user-scoped storage
Reset state

7. Delete Exercise
Delete from edit modal
Remove from goal
Persist correctly
Reset state

8. Reorder Exercises
Drag-and-drop reorder
Persist new order immediately
Must persist correctly per user

9. State + Validation Rules
Name required
Invalid numeric inputs must not crash
Editing state must not leak between exercises
Modal resets after Save/Cancel

10. Persistence + User Isolation Verification
You must ensure:
Data persists after killing the app
Data is tied to the correct user
Switching users shows completely different data sets

When you are done:
Go through the Phase 3 "Done When" checklist in SPEC.md and confirm each item passes.
Then stop and tell me:
What you built
Any decisions you made that weren't specified
How you implemented user data isolation
Anything that needs my input before Phase 4

Do not start Phase 4.

I will run these kill-and-reopen tests:
Core functionality
Double tap → opens Goal Detail
Single tap → expands/collapses without conflict
Add/edit/delete/reorder exercises → all persist after restart
Validation
Empty name blocked
Invalid numeric input does not crash
🔐 Multi-user isolation tests (NEW — MUST PASS)
Sign up as User A → create goals + exercises
Kill app → log out → sign up/login as User B
User B should see zero data from User A
Create data as User B
Kill app → log back into User A
User A’s original data should still exist and be unchanged
No cross-over at any point

15) nice work. one slight change i want to make is when i am on the goals page with the list of goals, and i click once on the goal to see the drop down of exercises, i would like you to provide more. what i mean by this is for example, if i had an exercise called sprints and i had listed 8 reps and 30 secs, when it is listed underneath the goal run marathon, i would like to see sprints (8 reps x 30 secs). can you describe to me what i just asked you to do? don't implement anything until i agree with your interpretation on what i just told you to do.
16) great job. i would like to add one more thing: when you are on the goals page and you click on one goal to get the exercise dropdown and then you click on another goal for its dropdown, the previous goal dropdown shouldn't close unless the user clicks on that goal again to close it manually. repeat back to me on what i want you to implement. don't implement anything until i agree with your interpretation. 
17) yes perfect. please implement this.

## RETURNED TO CHATGPT PRO 
4) please write my phase 4 prompt
5) for debugging purposes, do you think it would be helpful to have a place where i can toggle the date of the app to see if the repeat on the exercises actually work? because im confused on how i would test that this works otherwise. if you agree with me, could you rewrite the prompt for phase 4 to include this. if you don't agree with me, explain to me why 
6) so where is this debug UI date changer going to be exactly?
7) is having this debug UI date changer in the profile screen currently in my phase 4 prompt? if so, great. if not can you add that into my phase 4 prompt?
8) are you sure that this prompt is okay? the only thing that is on my profile page is the logout button and the home screen has not been programmed yet. just give me some confirmation or not confirmation.

## RETURNED TO CURSOR PRO (AGENT)
18) Phase 3 is complete and verified. We are now starting Phase 4.
Read SPEC.md and review the Phase 4 section in full before writing any code.
Your job is to complete every task in Phase 4 and verify every item in the "Done When" checklist before stopping. Do not start Phase 5.

🚨 CRITICAL GLOBAL REQUIREMENTS (APPLY TO EVERYTHING IN THIS PHASE)
1. User Data Isolation (MANDATORY)
All exercise data, including repeat rules, must remain scoped per user
Continue using user-specific storage keys
No cross-user data access under any condition
2. Repeat Logic Must Be Safe
Missing or partial repeat configs must never crash the app
All repeat handling must be defensive
3. Dev-Only Date Override (MANDATORY)
You must implement a debug-only date override system to test repeat logic.
Requirements:
Real system date is the default
Create a helper function (e.g., getEffectiveToday())
All date logic must use this helper instead of new Date()
Allow setting and clearing an override date (YYYY-MM-DD)
Persist override in AsyncStorage
Add a clear code comment marking this as DEBUG ONLY

Build the following:

1. Repeat Data Schema
{
  frequency: "week",
  interval: 1,
  daysOfWeek: ["Tuesday"],
  startDate: "YYYY-MM-DD",
  endType: "never",
  endDate: null
}

If not configured → repeat = null
Must persist and survive edits

2. Repeat Button
Inside Add/Edit Exercise modal:
Add a Repeat button
Opens Repeat Configuration UI
Keep this separate from main form state

3. Repeat Configuration UI
Allow user to configure:
Frequency
Day / Week / Month / Year
Interval
Number input (default 1)
Days of Week
Only when frequency = week
Multi-select (Sun–Sat)
Starts
Today or date picker
Ends
Never or date picker

4. Saving Repeat
Build valid repeat object
Attach to exercise
Save via user-scoped storage
Cancel must not modify existing data

5. Editing Repeat
Pre-fill if repeat exists
Overwrite on save
Allow removing repeat → set to null

6. Validation + Edge Cases
Handle safely:
Missing daysOfWeek (week)
Invalid interval
Missing start date
End date before start date
Partial configs
No crashes allowed.

7. DEBUG UI — Profile Screen (REQUIRED EXACT LOCATION)
You must add a temporary debug section inside the Profile screen.
Placement:
Below profile info
Clearly labeled: "DEBUG (TEMPORARY)"
UI must include:
Display:
"Current App Date: <value from getEffectiveToday()>"
Button: Set Override Date
Opens date picker or input
Saves override
Button: Clear Override
Removes override and returns to real date
Rules:
Must not interfere with normal Profile functionality
Must be clearly marked as temporary/debug-only
Must persist after killing and reopening the app
Add a code comment explaining:
This exists to test repeat scheduling without changing device date

8. Persistence Requirements
Repeat config must:
persist after restart
remain tied to correct user
survive edits
Debug override must:
persist after restart
clear cleanly

9. No Full Home Logic Yet
Do NOT fully implement repeat-based filtering in Home yet
You may create helper logic if needed, but keep it isolated

When you are done:
Go through the Phase 4 "Done When" checklist in SPEC.md and confirm each item passes.
Then stop and tell me:
What you built
Any decisions you made that weren't specified
How you implemented the debug date override
How you handled repeat edge cases
Anything that needs my input before Phase 5

Do not start Phase 5.

I will run these tests:
Repeat Tests
Weekly repeat (Tuesday) → persists after restart
No repeat → stored as null
End date → persists correctly
Debug Date Tests
Set override → kill app → reopen → still applied
Clear override → returns to real date
Change override multiple times → no crash
Editing Tests
Modify repeat → persists
Remove repeat → becomes null
Edge Cases
Partial input → no crash
Invalid interval → no crash
Bad date range → blocked or corrected
🔐 Multi-User Tests
User A creates repeat data
User B logs in → sees none of it
Switch back → User A data intact

19) ok so i see some initial problems: when i click on repeat, i don't see any popup to toggle the repeat. do you understand what the problem is? explain to me what the problem is. if i agree, i will allow you to fix it.