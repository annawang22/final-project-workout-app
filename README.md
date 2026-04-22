# Bibble: Workout Tracker App (React Native + Expo)

This is a mobile workout tracking app built with React Native and [Expo](https://expo.dev).

## Key Features
   - Create and manage workout goals
   - Add exercises with optional repeat schedules
   - View daily workouts on the Home screen
   - Mark exercises as complete and track progress
   - Undo completed execises through a logbook
   - Persist all data locally with user isolation
   - Control UI design (shift between dark and light mode)

## How to Use Bibble
1) Create an Account
   - Sign up with a username and password
2) Create Goals
   - Navigate to My Goals
   - Add a goal (e.g., "Build Upper Body Strength")
   - Add exercises to each goal
3) Add Repeat Schedules
   - Set exercises to repeat:
      - daily, weekly, monthly, etc.
   - Choose start date and optional end date
4) Activate Goals
   - Swipe right on a goal to activate it
   - Active goals feed into Home screen
5) Track Daily Workouts
   - Go to Home
   - See all exercises fro the day (from:
      - active goals
      - standalone exercises)
6) Complete Exercises
   - Tap the checkbox
   - Exercise fades out and is removed
   - Saved to your logbook for that day
7) Undo via Logbook
   - Go to Profile -> Logbook
   - Tap a completed exercise
   - It returns to Home as incomplete
8) Customize Profile
   - Set your name and profile picture
   - Toggle dark/light mode

## Features I'm Most Proud If
1. Repeat Scheduling System
2. UI Design
   - single tap -> expand
   - double tap -> navigate to Goal detail screen
   - swipe -> activate
   - tap and hold -> edit
3. Undo System via Logbook
4. Merging goal-based exercises and standalone exercises to the Home screen
5) Dark mode & custom profile 

## How to Run Locally
1. Install Node.js
2. Clone my repository
3. Install dependencies

   ```bash
   npm install
   ```

4. Start the app

   ```bash
   npx expo start
   ```
5. (If running on a device) Download Expo Go from the App Store
6. Scan the QR code from the terminal
7. App will open on phone

