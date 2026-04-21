# UI Design Spec — Workout App (Modern Fitness Style)

## Goal
Upgrade UI to feel like a modern fitness app (inspired by Strava):
- Clean, minimal, bold typography
- Strong hierarchy
- Consistent spacing and layout
- Dark/light mode support

---

## Phase UI-1 — Navigation Icons

### Requirements
- Replace default tab icons with:
  - Home → house icon
  - Goals → target/goal icon
  - Profile → user profile picture (if exists) or placeholder avatar

### Notes
- Use a consistent icon library (e.g., @expo/vector-icons)
- Profile icon should dynamically update if user sets a profile image

### Done When
- Icons render correctly on all tabs
- Profile icon updates dynamically
- No layout shifting

---

## Phase UI-2 — Unified Screen Headers

### Requirements
Standardize headers across:
- Home
- Goals
- Profile

### Style
- Same font family
- Same font size
- Same weight (bold or semi-bold)
- Same spacing (top padding + margin)

### Structure
[Header Title]
[Optional subtext / spacing divider]

### Done When
- All three screens visually match
- No inconsistent spacing
- Headers feel cohesive

---

## Phase UI-3 — Design System Foundation

### Typography
- Heading: Large, bold
- Subheading: Medium weight
- Body: Regular

### Spacing
- Use consistent spacing scale (e.g., 8px system)

### Colors
- Primary: Accent color (fitness style, e.g., orange/red)
- Background: Light or dark depending on mode
- Text: High contrast

### Done When
- No hardcoded random styles
- Consistent spacing + typography everywhere

---

## Phase UI-4 — Dark Mode Toggle

### Requirements
- Add toggle in Profile screen
- Persist preference in AsyncStorage
- App should re-render immediately

### Behavior
- Light mode default
- Dark mode:
  - Dark background
  - Light text
  - Adjust card colors

### Done When
- Toggle works instantly
- Preference persists after restart
- All screens adapt correctly

---

## Phase UI-5 — Home Screen Styling

### Goals
- Clean list design
- Card-style rows
- Strong hierarchy

### Elements
- Date header (large + bold)
- Exercise cards:
  - Rounded corners
  - Slight shadow
  - Clear spacing

### Done When
- Looks modern and uncluttered
- Easy to scan quickly

---

## Phase UI-6 — Goals Screen Styling

### Goals
- Make goals feel like structured items

### Elements
- Card-style goal rows
- Subtle expand/collapse animation
- Clear distinction between goal and exercises

### Done When
- Goals are visually grouped
- Dropdown feels smooth

---

## Phase UI-7 — Profile Screen Styling

### Goals
- Clean personal dashboard feel

### Elements
- Profile image large and centered
- Name + username hierarchy
- Section dividers

### Done When
- Profile feels polished
- Easy to navigate actions

---

## Phase UI-8 — Final Polish

### Tasks
- Align all paddings/margins
- Remove visual clutter
- Ensure consistency across all screens

### Done When
- App feels cohesive
- No mismatched styles
- Smooth UX across flows
