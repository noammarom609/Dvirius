# A.D.A V2 — Personalization + UI Refresh Design

**Date:** 2026-03-07
**Status:** Approved

## Goals

1. Remove all hardcoded references to creator "Naz/Nazir Louis" — replace with "Noam" or configurable values
2. Add first-run setup screen for user name, AI name, and Gemini API key
3. Refresh UI with balanced modern-minimalist + dark-elegant + improved sci-fi style

## 1. Creator Reference Cleanup

| File | Line(s) | Current | Change |
|------|---------|---------|--------|
| `backend/ada.py` | 193 | `"Your creator is Naz, and you address him as 'Sir'."` | Dynamic from settings: `user_name` |
| `README.md` | 86, 129 | `github.com/nazirlouis/ada_v2.git` | Generic placeholder or remove |
| `README.md` | 435 | `Built with ... by Nazir Louis` | `Built with ... by Noam` |
| `LICENSE` | 3 | `Copyright (c) 2025 Nazir Louis` | `Copyright (c) 2025 Noam` |

## 2. Personalization System

### Settings Schema Changes (`settings.json`)

New fields:
```json
{
  "user_name": "",
  "ai_name": "Ada",
  "setup_complete": false
}
```

API key remains in `.env` file (not in settings.json for security).

### First-Run Setup Flow

1. App opens -> frontend checks `settings.json` for `setup_complete`
2. If false -> show `SetupWizard` component (fullscreen, before AuthLock)
3. User fills: name, AI name, Gemini API key
4. On submit:
   - Frontend sends `complete_setup` socket event with `{user_name, ai_name, api_key}`
   - Backend saves names to `settings.json`, API key to `.env`
   - Backend sets `setup_complete: true`
   - Frontend transitions to main app
5. Names accessible in Settings window for later editing

### Backend Changes

- `ada.py`: System instruction built dynamically:
  ```python
  f"Your name is {ai_name}. "
  f"You have a witty and charming personality. "
  f"The user's name is {user_name}. "
  f"When answering, respond using complete and concise sentences..."
  ```
- `server.py`: New `complete_setup` event handler; pass names to AudioLoop config
- Settings loaded on startup, passed to AudioLoop constructor

### Frontend Changes

- New component: `SetupWizard.jsx`
- `App.jsx`: Check setup_complete before rendering main UI
- Title bar: Display AI name dynamically
- Chat module: Use user/AI names in transcriptions

## 3. UI Refresh

### Design Principles

- **Dark base** preserved (black/near-black backgrounds)
- **Glassmorphism**: `backdrop-blur-xl`, semi-transparent panels (`bg-white/5` or `bg-gray-900/60`)
- **Color palette**: Transition from pure cyan to **teal-to-purple gradient** for accents
  - Primary: `from-teal-400 to-violet-500`
  - Subtle: `text-teal-300`, borders `border-teal-500/20`
- **Rounded corners**: `rounded-2xl` for panels, `rounded-xl` for buttons
- **Shadows**: Soft colored glows instead of aggressive neon (`shadow-[0_0_30px_rgba(94,234,212,0.1)]`)
- **Typography**: Replace `Share Tech Mono` with `Inter` (body) + `JetBrains Mono` (status/code)
- **Spacing**: Increase padding/gaps throughout (`p-6` instead of `p-4`, `gap-4` instead of `gap-2`)
- **Animations**: Leverage existing framer-motion for smooth transitions

### Component-Specific Changes

#### SetupWizard (NEW)
- Fullscreen dark background with centered card
- Gradient-bordered input fields
- Animated step transitions
- Clean, welcoming feel

#### Title Bar
- More transparent with stronger blur
- Dynamic AI name display
- Softer window controls

#### Settings Window
- Wider panel with better categorization
- Card-based sections with subtle backgrounds
- Larger toggle switches
- Name editing fields added

#### Chat Module
- Styled message bubbles with sender labels (using configured names)
- Better spacing between messages
- Subtle gradient on user messages vs AI messages

#### Auth Lock
- Keep the scanning animation but with the new color palette
- Display "Welcome, {user_name}" after unlock

#### Status/Connection indicators
- Pill-shaped badges instead of text-only
- Subtle pulse animation for active states

## 4. Files to Modify

### Backend
- `backend/ada.py` — Dynamic system prompt
- `backend/server.py` — Setup event, pass names to config
- `backend/settings.json` — Add new fields

### Frontend
- `src/index.css` — New fonts, global style updates
- `src/App.jsx` — Setup flow logic, dynamic names, UI polish
- `src/components/SetupWizard.jsx` — NEW: First-run setup
- `src/components/SettingsWindow.jsx` — Name editing, style refresh
- `src/components/AuthLock.jsx` — New colors, personalized greeting
- `src/components/ChatModule.jsx` — Message styling, dynamic names
- `src/components/TopAudioBar.jsx` — Style refresh

### Other
- `README.md` — Remove Naz references
- `LICENSE` — Update copyright holder
