# A.D.A V2 — Personalization + UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove hardcoded creator references, add first-run setup wizard for personalization, and refresh the entire UI with a modern glassmorphism + teal-to-purple design.

**Architecture:** Three-phase approach: (1) Backend settings schema + cleanup, (2) Frontend SetupWizard + personalization wiring, (3) UI refresh across all components. Settings are persisted in `backend/settings.json` with new `user_name`, `ai_name`, `setup_complete` fields. The system prompt in `ada.py` is built dynamically from settings. The frontend checks `setup_complete` on load and shows SetupWizard if false.

**Tech Stack:** Python/FastAPI backend, React 18 + Tailwind CSS + Framer Motion frontend, Electron shell, Socket.IO for communication.

---

## Phase 1: Backend — Settings & Cleanup

### Task 1: Clean creator references from static files

**Files:**
- Modify: `LICENSE` (line 3)
- Modify: `README.md` (lines 86, 129, 435)

**Step 1: Update LICENSE**

In `LICENSE` line 3, change:
```
Copyright (c) 2025 Nazir Louis
```
to:
```
Copyright (c) 2025 Noam
```

**Step 2: Update README.md**

Replace all 3 occurrences:
- Line 86: `git clone https://github.com/nazirlouis/ada_v2.git && cd ada_v2` → `git clone https://github.com/your-username/ada_v2.git && cd ada_v2`
- Line 129: `git clone https://github.com/nazirlouis/ada_v2.git` → `git clone https://github.com/your-username/ada_v2.git`
- Line 435: `<strong>Built with ... by Nazir Louis</strong>` → `<strong>Built with ... by Noam</strong>`

**Step 3: Commit**

```bash
git add LICENSE README.md
git commit -m "chore: replace creator references with Noam"
```

---

### Task 2: Add personalization fields to backend settings

**Files:**
- Modify: `backend/settings.json`
- Modify: `backend/server.py` (lines 60-75 DEFAULT_SETTINGS)

**Step 1: Update DEFAULT_SETTINGS in server.py**

In `backend/server.py` lines 60-75, the `DEFAULT_SETTINGS` dict currently has 5 keys. Add 3 new keys at the top:

```python
DEFAULT_SETTINGS = {
    "user_name": "",
    "ai_name": "Ada",
    "setup_complete": False,
    "face_auth_enabled": False,
    "tool_permissions": {
        "generate_cad": True,
        "run_web_agent": True,
        "write_file": True,
        "read_directory": True,
        "read_file": True,
        "create_project": True,
        "switch_project": True,
        "list_projects": True
    },
    "printers": [],
    "kasa_devices": [],
    "camera_flipped": False
}
```

**Step 2: Update settings.json**

Add the 3 new fields to the existing `backend/settings.json`, keeping existing printer configs:

```json
{
    "user_name": "",
    "ai_name": "Ada",
    "setup_complete": false,
    "face_auth_enabled": false,
    ...rest stays the same...
}
```

**Step 3: Commit**

```bash
git add backend/server.py backend/settings.json
git commit -m "feat: add user_name, ai_name, setup_complete to settings schema"
```

---

### Task 3: Add complete_setup socket event to server.py

**Files:**
- Modify: `backend/server.py` (add new event after `update_settings` at ~line 962)

**Step 1: Add complete_setup event handler**

After the `update_settings` event handler (line 962), add:

```python
@sio.event
async def complete_setup(sid, data):
    """Handle first-run setup: save user name, AI name, and API key."""
    user_name = data.get('user_name', '')
    ai_name = data.get('ai_name', 'Ada')
    api_key = data.get('api_key', '')

    print(f"[SERVER] Setup: user_name={user_name}, ai_name={ai_name}, api_key={'***' if api_key else 'EMPTY'}")

    # Save names to settings
    SETTINGS["user_name"] = user_name
    SETTINGS["ai_name"] = ai_name
    SETTINGS["setup_complete"] = True
    save_settings()

    # Save API key to .env file
    if api_key:
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
        try:
            with open(env_path, 'w') as f:
                f.write(f"GEMINI_API_KEY={api_key}\n")
            print(f"[SERVER] API key saved to {env_path}")
        except Exception as e:
            print(f"[SERVER] Error saving API key: {e}")
            await sio.emit('error', {'msg': f"Failed to save API key: {str(e)}"})
            return

    # Broadcast updated settings
    await sio.emit('settings', SETTINGS)
    await sio.emit('status', {'msg': 'Setup complete!'})
```

**Step 2: Also handle name updates in update_settings**

In the existing `update_settings` handler (lines 937-962), add handling for the new fields. After the `camera_flipped` block (~line 958), add:

```python
    if "user_name" in data:
        SETTINGS["user_name"] = data["user_name"]

    if "ai_name" in data:
        SETTINGS["ai_name"] = data["ai_name"]
```

**Step 3: Commit**

```bash
git add backend/server.py
git commit -m "feat: add complete_setup event and name update handling"
```

---

### Task 4: Make ada.py system prompt dynamic

**Files:**
- Modify: `backend/ada.py` (lines 186-204 — config definition)
- Modify: `backend/ada.py` (AudioLoop constructor ~line 213)

**Step 1: Replace static config with a config-building function**

Replace the static `config = types.LiveConnectConfig(...)` block (lines 186-204) with a function that builds the config dynamically:

```python
def build_config(user_name="", ai_name="Ada"):
    """Build Gemini LiveConnectConfig with dynamic names."""
    instruction_parts = [
        f"Your name is {ai_name}. ",
        "You have a witty and charming personality. ",
    ]
    if user_name:
        instruction_parts.append(f"The user's name is {user_name}. ")
    instruction_parts.append(
        "When answering, respond using complete and concise sentences "
        "to keep a quick pacing and keep the conversation flowing. "
        "You have a fun personality."
    )

    return types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        output_audio_transcription={},
        input_audio_transcription={},
        system_instruction="".join(instruction_parts),
        tools=tools,
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Kore"
                )
            )
        )
    )

# Default config (used if no settings passed)
config = build_config()
```

**Step 2: Update AudioLoop constructor to accept names**

In the AudioLoop `__init__` method (line 213), add `user_name=""` and `ai_name="Ada"` parameters:

Current signature:
```python
def __init__(self, video_mode=DEFAULT_MODE, on_audio_data=None, on_video_frame=None, on_cad_data=None, on_web_data=None, on_transcription=None, on_tool_confirmation=None, on_cad_status=None, on_cad_thought=None, on_project_update=None, on_device_update=None, on_error=None, input_device_index=None, input_device_name=None, output_device_index=None, kasa_agent=None):
```

Add at the end:
```python
    ..., kasa_agent=None, user_name="", ai_name="Ada"):
```

And in the constructor body, store and use them. Find where `self.audio_stream = None` is set (around line 231) and add after it:

```python
        self.user_name = user_name
        self.ai_name = ai_name
```

**Step 3: Use dynamic config in the session**

Find where `config` is used to create the session. Search for `client.aio.live.connect(model=MODEL, config=config)` — this is in the `run()` method. Replace `config=config` with `config=build_config(self.user_name, self.ai_name)`.

**Step 4: Pass names from server.py to AudioLoop**

In `backend/server.py`, in the `start_audio` event handler where AudioLoop is initialized (~line 274), add the names:

```python
audio_loop = ada.AudioLoop(
    video_mode="none",
    ...existing params...,
    kasa_agent=kasa_agent,
    user_name=SETTINGS.get("user_name", ""),
    ai_name=SETTINGS.get("ai_name", "Ada")
)
```

**Step 5: Commit**

```bash
git add backend/ada.py backend/server.py
git commit -m "feat: dynamic system prompt with configurable user and AI names"
```

---

## Phase 2: Frontend — SetupWizard & Personalization

### Task 5: Update fonts and Tailwind config

**Files:**
- Modify: `src/index.css` (line 1 — font import)
- Modify: `tailwind.config.js` (lines 9-11 — font family)

**Step 1: Update font imports in index.css**

Replace line 1:
```css
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
```
with:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

**Step 2: Update tailwind.config.js**

Replace the entire theme.extend block:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}
```

Note: We remove the custom cyan color overrides so Tailwind's full default palette (including teal, violet, etc.) is available.

**Step 3: Update body font in index.css**

Add `font-family: 'Inter', system-ui, sans-serif;` to the body rule:

```css
body {
  margin: 0;
  background-color: #000;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}
```

**Step 4: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat: switch fonts to Inter + JetBrains Mono, update Tailwind config"
```

---

### Task 6: Create SetupWizard component

**Files:**
- Create: `src/components/SetupWizard.jsx`

**Step 1: Create the SetupWizard component**

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SetupWizard = ({ socket, onComplete }) => {
    const [userName, setUserName] = useState('');
    const [aiName, setAiName] = useState('Ada');
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!apiKey.trim()) {
            setError('Please enter your Gemini API key');
            return;
        }

        setIsSubmitting(true);
        setError('');

        socket.emit('complete_setup', {
            user_name: userName.trim(),
            ai_name: aiName.trim() || 'Ada',
            api_key: apiKey.trim()
        });

        // Listen for confirmation
        const handleSettings = (settings) => {
            if (settings.setup_complete) {
                socket.off('settings', handleSettings);
                socket.off('error', handleError);
                onComplete(settings);
            }
        };
        const handleError = (data) => {
            setError(data.msg);
            setIsSubmitting(false);
        };

        socket.on('settings', handleSettings);
        socket.on('error', handleError);
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/40 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-md mx-4"
            >
                {/* Card */}
                <div className="relative bg-gray-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_80px_rgba(94,234,212,0.06)]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-semibold bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent"
                        >
                            Welcome
                        </motion.h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Let's set up your AI assistant
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-5">
                        {/* User Name */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all"
                                autoFocus
                            />
                        </div>

                        {/* AI Name */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                AI Assistant Name
                            </label>
                            <input
                                type="text"
                                value={aiName}
                                onChange={(e) => setAiName(e.target.value)}
                                placeholder="Ada"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all"
                            />
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-mono text-sm"
                            />
                            <p className="text-[11px] text-gray-600 mt-1.5">
                                Get your key from Google AI Studio
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-300 bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 hover:shadow-[0_0_30px_rgba(94,234,212,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Setting up...' : 'Get Started'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SetupWizard;
```

**Step 2: Commit**

```bash
git add src/components/SetupWizard.jsx
git commit -m "feat: create SetupWizard component for first-run personalization"
```

---

### Task 7: Wire SetupWizard into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add import for SetupWizard**

After the existing component imports (around line 17, after `import SettingsWindow`), add:

```javascript
import SetupWizard from './components/SetupWizard';
```

**Step 2: Add setup state**

After the `isLockScreenVisible` state (around line 37), add:

```javascript
const [setupComplete, setSetupComplete] = useState(() => {
    return localStorage.getItem('setup_complete') === 'true';
});
const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || '');
const [aiName, setAiName] = useState(() => localStorage.getItem('ai_name') || 'Ada');
```

**Step 3: Handle settings event to capture names**

In the `socket.on('settings', ...)` handler (around line 360), add after the camera_flipped block:

```javascript
            if (typeof settings.setup_complete !== 'undefined') {
                setSetupComplete(settings.setup_complete);
                localStorage.setItem('setup_complete', settings.setup_complete);
            }
            if (settings.user_name) {
                setUserName(settings.user_name);
                localStorage.setItem('user_name', settings.user_name);
            }
            if (settings.ai_name) {
                setAiName(settings.ai_name);
                localStorage.setItem('ai_name', settings.ai_name);
            }
```

**Step 4: Add SetupWizard render**

In the JSX return, right at the very top (before the AuthLock conditional), add:

```jsx
{!setupComplete && (
    <SetupWizard
        socket={socket}
        onComplete={(settings) => {
            setSetupComplete(true);
            setUserName(settings.user_name);
            setAiName(settings.ai_name);
            localStorage.setItem('setup_complete', 'true');
            localStorage.setItem('user_name', settings.user_name);
            localStorage.setItem('ai_name', settings.ai_name);
        }}
    />
)}
```

**Step 5: Replace hardcoded "A.D.A" in title bar**

Line 1400: Replace `A.D.A` with `{aiName}`:
```jsx
<h1 className="text-xl font-bold tracking-[0.2em] text-teal-400 drop-shadow-[0_0_10px_rgba(94,234,212,0.5)]">
    {aiName}
</h1>
```

**Step 6: Replace "A.D.A Started"/"A.D.A Stopped" checks**

Lines 332-334: These status messages come from the backend. Update server.py to use dynamic names, but also make frontend checks more resilient:

```javascript
if (data.msg.includes('Started')) {
    setStatus('Model Connected');
} else if (data.msg.includes('Stopped')) {
    setStatus('Connected');
}
```

**Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire SetupWizard into App, dynamic AI name in title bar"
```

---

### Task 8: Update server.py status messages to use dynamic name

**Files:**
- Modify: `backend/server.py` (lines 129, 134, 206, 316-317, 382)

**Step 1: Replace hardcoded "A.D.A" status messages**

Use `SETTINGS.get("ai_name", "A.D.A")` for dynamic messages:

- Line 129: `'service': 'A.D.A Backend'` → `'service': f'{SETTINGS.get("ai_name", "A.D.A")} Backend'`
- Line 134: `'msg': 'Connected to A.D.A Backend'` → `'msg': f'Connected to {SETTINGS.get("ai_name", "A.D.A")} Backend'`
- Line 206: `'msg': 'A.D.A Already Running'` → `'msg': f'{SETTINGS.get("ai_name", "A.D.A")} Already Running'`
- Line 317: `'msg': 'A.D.A Started'` → `'msg': f'{SETTINGS.get("ai_name", "A.D.A")} Started'`
- Line 382: `'msg': 'A.D.A Stopped'` → `'msg': f'{SETTINGS.get("ai_name", "A.D.A")} Stopped'`

**Step 2: Commit**

```bash
git add backend/server.py
git commit -m "feat: use dynamic AI name in server status messages"
```

---

### Task 9: Pass names to Visualizer and update display

**Files:**
- Modify: `src/components/Visualizer.jsx` (line 4 — props, line 96 — text)
- Modify: `src/App.jsx` (where Visualizer is rendered, pass `aiName`)

**Step 1: Add `name` prop to Visualizer**

Line 4, add `name` to props:
```jsx
const Visualizer = ({ audioData, isListening, intensity = 0, width = 600, height = 400, name = "A.D.A" }) => {
```

Line 96, replace hardcoded text:
```jsx
                    {name}
```

**Step 2: Pass `aiName` from App.jsx**

Find where `<Visualizer` is rendered in App.jsx and add the `name` prop:
```jsx
<Visualizer ... name={aiName} />
```

**Step 3: Commit**

```bash
git add src/components/Visualizer.jsx src/App.jsx
git commit -m "feat: display dynamic AI name in Visualizer"
```

---

### Task 10: Add name editing to SettingsWindow

**Files:**
- Modify: `src/components/SettingsWindow.jsx`

**Step 1: Add name props**

Add new props to the component: `userName`, `setUserName`, `aiName`, `setAiName`

Update the component signature:
```javascript
const SettingsWindow = ({
    socket,
    userName,
    aiName,
    ...existing props...
})
```

**Step 2: Add name editing section**

After the Security section (line 114) and before the Microphone section (line 116), add:

```jsx
            {/* Personalization Section */}
            <div className="mb-6">
                <h3 className="text-teal-400 font-medium mb-3 text-xs uppercase tracking-wider opacity-80">Personalization</h3>
                <div className="space-y-2">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Your Name</label>
                        <input
                            type="text"
                            value={userName || ''}
                            onChange={(e) => {
                                socket.emit('update_settings', { user_name: e.target.value });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-teal-500/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">AI Name</label>
                        <input
                            type="text"
                            value={aiName || 'Ada'}
                            onChange={(e) => {
                                socket.emit('update_settings', { ai_name: e.target.value });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-teal-500/50 outline-none"
                        />
                    </div>
                </div>
            </div>
```

**Step 3: Pass the new props from App.jsx**

Find where `<SettingsWindow` is rendered in App.jsx and add:
```jsx
userName={userName}
aiName={aiName}
```

**Step 4: Commit**

```bash
git add src/components/SettingsWindow.jsx src/App.jsx
git commit -m "feat: add name editing fields to Settings window"
```

---

## Phase 3: UI Refresh

### Task 11: Update AuthLock colors and add personalized greeting

**Files:**
- Modify: `src/components/AuthLock.jsx`

**Step 1: Add `userName` prop**

```jsx
const AuthLock = ({ socket, onAuthenticated, onAnimationComplete, userName }) => {
```

**Step 2: Update colors from cyan to teal**

Replace throughout the file:
- `text-cyan-500` → `text-teal-400`
- `border-cyan-500` → `border-teal-400`
- `shadow-[0_0_50px_rgba(34,211,238,0.2)]` → `shadow-[0_0_50px_rgba(94,234,212,0.15)]`
- `from-cyan-900/20` → `from-teal-900/20`
- `text-cyan-300` → `text-teal-300`
- `text-cyan-800` → `text-teal-800`
- `bg-cyan-400/80` → `bg-teal-400/80`
- `shadow-[0_0_15px_cyan]` → `shadow-[0_0_15px_rgba(94,234,212,0.6)]`

**Step 3: Personalize success message**

Line 17, change:
```javascript
setMessage("Identity Verified. Access Granted.");
```
to:
```javascript
setMessage(userName ? `Welcome back, ${userName}.` : "Identity Verified. Access Granted.");
```

**Step 4: Pass `userName` from App.jsx**

Find where `<AuthLock` is rendered and add `userName={userName}`.

**Step 5: Commit**

```bash
git add src/components/AuthLock.jsx src/App.jsx
git commit -m "feat: update AuthLock with teal palette and personalized greeting"
```

---

### Task 12: Refresh ChatModule styling

**Files:**
- Modify: `src/components/ChatModule.jsx`

**Step 1: Update message styling with differentiated bubbles**

Replace the messages rendering block (lines 47-52) with:

```jsx
{messages.slice(-5).map((msg, i) => {
    const isAI = msg.sender !== 'User' && msg.sender !== 'System';
    return (
        <div key={i} className={`text-sm rounded-xl px-4 py-2.5 ${
            msg.sender === 'System'
                ? 'bg-white/5 border border-white/5 text-gray-500 text-xs'
                : isAI
                    ? 'bg-teal-500/5 border border-teal-500/10'
                    : 'bg-violet-500/5 border border-violet-500/10'
        }`}>
            <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium text-xs ${
                    msg.sender === 'System' ? 'text-gray-600' : isAI ? 'text-teal-400' : 'text-violet-400'
                }`}>{msg.sender}</span>
                <span className="text-gray-700 font-mono text-[10px]">{msg.time}</span>
            </div>
            <div className="text-gray-300 leading-relaxed">{msg.text}</div>
        </div>
    );
})}
```

**Step 2: Update input styling**

Replace the input element (line 57-64) styling:

```jsx
<input
    type="text"
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    onKeyDown={handleSend}
    placeholder="Type a message..."
    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder-gray-600 text-sm"
/>
```

**Step 3: Update container border color**

Line 48: Replace `border-cyan-800/50` with the new bubble approach (already done in step 1 above — the old border-l style is replaced with rounded cards).

**Step 4: Commit**

```bash
git add src/components/ChatModule.jsx
git commit -m "feat: refresh ChatModule with differentiated message bubbles and teal/violet palette"
```

---

### Task 13: Refresh SettingsWindow styling

**Files:**
- Modify: `src/components/SettingsWindow.jsx`

**Step 1: Update container styling**

Line 92, replace:
```jsx
<div className="absolute top-20 right-10 bg-black/90 border border-cyan-500/50 p-4 rounded-lg z-50 w-80 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.2)]">
```
with:
```jsx
<div className="absolute top-20 right-10 bg-gray-950/90 border border-white/10 p-6 rounded-2xl z-50 w-96 backdrop-blur-2xl shadow-[0_0_60px_rgba(94,234,212,0.06)]">
```

**Step 2: Update all cyan color references to teal**

Throughout the file, replace:
- `text-cyan-400` → `text-teal-400` (headings)
- `text-cyan-100/80` → `text-gray-300` (labels)
- `text-cyan-600` → `text-teal-500` (hover states on close button)
- `border-cyan-500/50` → `border-white/10`
- `border-cyan-900/50` → `border-white/5`
- `border-cyan-900/30` → `border-white/10`
- `border-cyan-800` → `border-white/10`
- `text-cyan-100` → `text-white`
- `bg-cyan-500/80` → `bg-teal-500` (toggle ON state)
- `focus:border-cyan-400` → `focus:border-teal-500/50`
- `accent-cyan-400` → `accent-teal-400`
- `text-cyan-500` → `text-teal-400`
- `text-cyan-500/60` → `text-gray-500`
- `bg-cyan-900` → `bg-teal-900/50`
- `file:text-cyan-400` → `file:text-teal-400`
- `hover:file:bg-cyan-800` → `hover:file:bg-teal-800`

**Step 3: Update section title styling pattern**

Replace `font-bold` with `font-medium` for section headings for a softer look.

**Step 4: Widen the panel**

Already done in step 1 (w-80 → w-96).

**Step 5: Commit**

```bash
git add src/components/SettingsWindow.jsx
git commit -m "feat: refresh SettingsWindow with teal palette, wider layout, softer styling"
```

---

### Task 14: Refresh App.jsx main layout colors

**Files:**
- Modify: `src/App.jsx`

**Step 1: Update title bar**

Line 1397, replace:
```jsx
<div className="z-50 flex items-center justify-between p-2 border-b border-cyan-500/20 bg-black/40 backdrop-blur-md select-none sticky top-0"
```
with:
```jsx
<div className="z-50 flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-black/30 backdrop-blur-2xl select-none sticky top-0"
```

**Step 2: Update version badge**

Line 1402-1404, replace:
```jsx
<div className="text-[10px] text-cyan-700 border border-cyan-900 px-1 rounded">
    V2.0.0
</div>
```
with:
```jsx
<div className="text-[10px] text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">
    V2.0.0
</div>
```

**Step 3: Update clock and window controls**

Line 1434: Replace `text-cyan-300/70` → `text-gray-400`
Line 1435: Replace `text-cyan-500/50` → `text-gray-600`
Lines 1438-1446: Replace `hover:bg-cyan-900/50` → `hover:bg-white/5` and `text-cyan-500` → `text-gray-400`

**Step 4: Update ambient glow**

Line 1393: Replace:
```jsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
```
with:
```jsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />
```

**Step 5: Update hand cursor**

Line 1372: Replace `bg-cyan-400 border-cyan-400` → `bg-teal-400 border-teal-400` and `rgba(34,211,238,0.8)` → `rgba(94,234,212,0.8)` and `border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]` → `border-teal-400 shadow-[0_0_10px_rgba(94,234,212,0.3)]`

**Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: refresh App layout with teal palette, softer chrome, better spacing"
```

---

### Task 15: Refresh Visualizer colors

**Files:**
- Modify: `src/components/Visualizer.jsx`

**Step 1: Update canvas drawing colors**

Replace all cyan color references in the canvas drawing:

- Line 50: `'rgba(6, 182, 212, 0.1)'` → `'rgba(94, 234, 212, 0.08)'`
- Line 61: `'rgba(34, 211, 238, 0.5)'` → `'rgba(94, 234, 212, 0.4)'`
- Line 64: `'#22d3ee'` → `'#5eead4'`
- Line 71: `'rgba(34, 211, 238, 0.8)'` → `'rgba(94, 234, 212, 0.7)'`
- Line 74: `'#22d3ee'` → `'#5eead4'`

**Step 2: Update text styling**

Line 93: Replace:
```jsx
className="text-cyan-100 font-bold tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
```
with:
```jsx
className="text-teal-100 font-semibold tracking-[0.25em] drop-shadow-[0_0_20px_rgba(94,234,212,0.6)]"
```

**Step 3: Commit**

```bash
git add src/components/Visualizer.jsx
git commit -m "feat: refresh Visualizer with teal color palette"
```

---

### Task 16: Refresh TopAudioBar colors

**Files:**
- Modify: `src/components/TopAudioBar.jsx`

**Step 1: Update bar color**

Find the rgba color used for drawing bars. It should be around `rgba(34, 211, 238, ...)`. Replace with:
```javascript
`rgba(94, 234, 212, ${0.2 + percent * 0.8})`
```

**Step 2: Commit**

```bash
git add src/components/TopAudioBar.jsx
git commit -m "feat: refresh TopAudioBar with teal color"
```

---

### Task 17: Refresh ToolsModule inactive state colors

**Files:**
- Modify: `src/components/ToolsModule.jsx`

**Step 1: Update all inactive button states**

Throughout the file, replace the inactive/default state colors:
- `border-cyan-900 text-cyan-700 hover:border-cyan-500 hover:text-cyan-500` → `border-white/10 text-gray-500 hover:border-teal-500/30 hover:text-teal-400`
- `border-cyan-400 text-cyan-400 bg-cyan-900/20` (Settings active) → `border-teal-400 text-teal-400 bg-teal-900/20`
- `border-cyan-400 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]` (CAD active) → `border-teal-400 bg-teal-400/10 text-teal-400 hover:bg-teal-400/20 shadow-[0_0_15px_rgba(94,234,212,0.2)]`
- `border-cyan-500 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]` (mic unmuted) → `border-teal-400 bg-teal-400/10 text-teal-400 hover:bg-teal-400/20 shadow-[0_0_15px_rgba(94,234,212,0.2)]`

**Step 2: Commit**

```bash
git add src/components/ToolsModule.jsx
git commit -m "feat: refresh ToolsModule with teal palette for inactive/default states"
```

---

### Task 18: Final integration test and commit

**Step 1: Run the development server**

```bash
npm run dev
```

**Step 2: Verify checklist**

- [ ] SetupWizard appears on first launch (when `setup_complete` is false)
- [ ] After entering name + AI name + API key, setup completes and main UI loads
- [ ] Title bar shows the configured AI name
- [ ] Visualizer shows the configured AI name
- [ ] Settings window allows editing names
- [ ] No "Naz", "Nazir", or "Sir" references remain
- [ ] Color scheme is teal/violet (no leftover cyan)
- [ ] Fonts are Inter (body) + JetBrains Mono (code)
- [ ] AuthLock uses teal color scheme
- [ ] Chat messages have differentiated bubbles

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat: complete personalization + UI refresh implementation"
```

---

## File Change Summary

| File | Action | What Changes |
|------|--------|-------------|
| `LICENSE` | Modify | Copyright holder → Noam |
| `README.md` | Modify | Remove Naz references |
| `backend/settings.json` | Modify | Add user_name, ai_name, setup_complete |
| `backend/server.py` | Modify | DEFAULT_SETTINGS, complete_setup event, dynamic messages |
| `backend/ada.py` | Modify | build_config() function, dynamic system prompt |
| `src/index.css` | Modify | Inter + JetBrains Mono fonts |
| `tailwind.config.js` | Modify | Font families, remove cyan overrides |
| `src/components/SetupWizard.jsx` | Create | First-run setup wizard |
| `src/App.jsx` | Modify | Setup flow, dynamic names, teal palette |
| `src/components/SettingsWindow.jsx` | Modify | Name editing, teal palette, wider |
| `src/components/AuthLock.jsx` | Modify | Teal palette, personalized greeting |
| `src/components/ChatModule.jsx` | Modify | Message bubbles, teal/violet |
| `src/components/Visualizer.jsx` | Modify | Dynamic name, teal palette |
| `src/components/TopAudioBar.jsx` | Modify | Teal bar color |
| `src/components/ToolsModule.jsx` | Modify | Teal inactive states |
