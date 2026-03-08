# Dvirious — תוכנית הפיכה למוצר מסחרי

> המטרה: להפוך את Dvirious מפרויקט אישי למוצר מסחרי בסגנון Cursor —
> עם auth, subscriptions, cloud backend, auto-updates, ו-branding מקצועי.

---

## מצב נוכחי vs. מצב יעד

| היבט | היום | יעד |
|---|---|---|
| **Auth** | אין. כל מי שפותח את האפליקציה נכנס | OAuth (Google/GitHub/Email), מסך login |
| **API Key** | המשתמש מביא Gemini key משלו | Dvirious מנהל — המשתמש לא רואה API key |
| **Backend** | Python מקומי על המחשב של המשתמש | Cloud backend (API proxy + usage tracking) + local backend לאודיו |
| **Billing** | אין | Polar — Free / Pro / Business |
| **Updates** | ידני (build חדש) | Auto-update שקט דרך Electron |
| **Analytics** | אין | Telemetry + error reporting |
| **Branding** | בסיסי | Logo, splash screen, landing page, docs |
| **Onboarding** | Setup wizard עם API key | Login → תשלום (או Free) → מוכן |

---

## ארכיטקטורה חדשה

```
┌─────────────────────────────────────────────────┐
│                  Dvirious Desktop                │
│           (Electron + React + TailwindCSS)       │
│                                                   │
│  ┌─────────┐ ┌──────┐ ┌─────┐ ┌──────────────┐  │
│  │Visualizer│ │ Chat │ │ CAD │ │ Browser/Kasa │  │
│  └─────────┘ └──────┘ └─────┘ └──────────────┘  │
│                       │                           │
│              Local Audio Engine                   │
│         (Mic capture, playback, VAD)              │
│                       │                           │
└───────────────────────┼───────────────────────────┘
                        │ WebSocket / HTTPS
                        ▼
┌─────────────────────────────────────────────────┐
│              Dvirious Cloud Backend              │
│                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Auth API  │  │ AI Proxy  │  │ Usage Tracker│  │
│  │(Supabase) │  │(Gemini/   │  │  + Billing   │  │
│  │           │  │ OpenAI/   │  │  (Polar)    │  │
│  │           │  │ Claude)   │  │              │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
│                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Update   │  │ Analytics │  │  User Data   │  │
│  │ Server   │  │ Pipeline  │  │  Storage     │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

### מה רץ מקומית vs. מה רץ בענן

| מקומי (Desktop) | ענן (Cloud Backend) |
|---|---|
| Electron shell | Auth + User management |
| React UI | AI API proxy (Gemini/Claude/GPT) |
| Mic capture + playback | Usage metering + quotas |
| VAD (Voice Activity Detection) | Billing (Polar) |
| Hand tracking (MediaPipe) | Update server |
| Camera capture | Analytics pipeline |
| Face auth (optional) | User settings sync |
| CAD script execution (build123d) | License validation |
| Printer communication (local network) | |
| Kasa control (local network) | |

> **הרציונל:** אודיו, וידאו, CAD, ומכשירים מקומיים חייבים לרוץ מקומית (latency + privacy).
> כל מה שקשור ל-AI, auth, billing, ו-updates רץ בענן.

---

## שלבים ליישום

---

### Phase 1: תשתית Auth + Cloud Backend
> **עדיפות: קריטי** | **משך: 2-3 שבועות**

#### 1.1 Cloud Backend Setup

**טכנולוגיה מומלצת:**
- **Supabase** — Auth, Database, Edge Functions (חינם עד 50k MAU)
- **Vercel** או **Railway** — Backend hosting
- **FastAPI** (Python) — API server (כבר מוכר לך)

**מה לבנות:**
```
cloud-backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── auth/
│   │   ├── router.py        # /auth/login, /auth/register, /auth/refresh
│   │   ├── supabase.py      # Supabase client
│   │   └── middleware.py     # JWT validation middleware
│   ├── ai_proxy/
│   │   ├── router.py        # /ai/session, /ai/generate
│   │   ├── gemini.py        # Gemini API calls
│   │   ├── usage.py         # Credit tracking per user
│   │   └── rate_limiter.py  # Rate limiting per plan
│   ├── billing/
│   │   ├── router.py        # /billing/subscribe, /billing/portal
│   │   ├── billing.py       # Polar integration
│   │   └── plans.py         # Plan definitions
│   ├── users/
│   │   ├── router.py        # /users/me, /users/settings
│   │   └── models.py        # User models
│   └── updates/
│       └── router.py        # /updates/check, /updates/latest
├── requirements.txt
└── Dockerfile
```

#### 1.2 Auth System

**User Flow:**
```
App Launch → Login Screen → OAuth (Google/GitHub) or Email
    → Token stored locally → Validated on each AI request
    → Subscription check → Route to appropriate tier
```

**Desktop Side (Electron):**
- מסך Login חדש (לפני כל דבר אחר)
- OAuth flow: פותח דפדפן → callback → token חוזר לאפליקציה
- Token storage: `electron-store` (encrypted) או Keychain/Credential Manager
- כל קריאת AI עוברת דרך ה-cloud backend עם ה-token

**שינויים נדרשים ב-Electron:**
```javascript
// electron/main.js — להוסיף:
// 1. Deep link handler (dvirious://auth/callback)
// 2. Token storage
// 3. Session management
```

#### 1.3 AI Proxy

**במקום שהמשתמש מביא API key:**
- Desktop שולח audio/text ל-Cloud Backend
- Cloud Backend מוסיף את ה-API key של Dvirious ושולח ל-Gemini
- Cloud Backend סופר credits ומגביל לפי plan

**אתגר מרכזי:** Gemini Live API דורש WebSocket ישיר. אפשרויות:
1. **Proxy WebSocket** — Cloud backend מעביר את ה-WebSocket (מורכב אבל שליטה מלאה)
2. **Signed tokens** — Cloud backend נותן temporary API key/token, Desktop מתחבר ישירות (פשוט יותר)
3. **Hybrid** — Text/tools דרך cloud, audio ישירות עם temporary credentials

> **המלצה:** להתחיל עם אפשרות 2 (signed tokens) — Cloud backend מנפיק temporary Gemini API key
> עם TTL, Desktop משתמש בו ישירות. פשוט ליישום, נמוך ב-latency.

---

### Phase 2: Billing + Subscriptions
> **עדיפות: קריטי** | **משך: 1-2 שבועות**

#### 2.1 Polar Integration

**Plans:**

| Plan | מחיר | מה כלול |
|---|---|---|
| **Free** | $0 | 30 דקות שיחה/יום, ללא CAD, ללא Web Agent |
| **Pro** | $20/חודש | שיחה ללא הגבלה, CAD, Web Agent, Smart Home, Printers |
| **Business** | $50/חודש | הכל + Priority, API access, Team management |

**Credit System (אופציונלי בהתחלה):**
- כל דקת שיחה = X credits
- כל יצירת CAD = Y credits
- כל Web Agent task = Z credits
- Free = 100 credits/יום, Pro = unlimited

**שינויים ב-Desktop:**
```jsx
// רכיב חדש: PlanBanner.jsx
// מציג את ה-plan הנוכחי, שימוש, ו-upgrade button
// מופיע בתחתית המסך או ב-Settings
```

#### 2.2 Polar Checkout Flow

```
User clicks "Upgrade" in app
    → Opens browser to Polar Checkout (hosted by Dvirious)
    → Payment processed
    → Webhook notifies Cloud Backend
    → Cloud Backend updates user plan
    → Desktop app refreshes entitlements
```

**Polar Webhooks לטפל:**
- `checkout.session.completed` — הפעלת subscription
- `invoice.paid` — חידוש מוצלח
- `customer.subscription.deleted` — ירידה ל-Free
- `invoice.payment_failed` — התראה + grace period

---

### Phase 3: Auto-Updates
> **עדיפות: גבוה** | **משך: 1 שבוע**

#### 3.1 Electron Auto-Updater

**ספרייה:** `electron-updater` (חלק מ-electron-builder)

**שינויים ב-`electron/main.js`:**
```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
    // Notify user: "Update available, downloading..."
});

autoUpdater.on('update-downloaded', (info) => {
    // Notify user: "Update ready. Restart to apply."
});

app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify();
});
```

**Update Server Options:**
1. **GitHub Releases** — חינם, פשוט. electron-updater תומך ב-GitHub out of the box
2. **S3/R2 + CloudFront** — יותר שליטה, טוב לקנה מידה
3. **Hazel/Nuts** — open source update servers

> **המלצה:** להתחיל עם GitHub Releases (חינם וקל), לעבור ל-S3 כשגדלים.

#### 3.2 CI/CD Pipeline

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run dist
      - uses: softprops/action-gh-release@v1
        with:
          files: release/*
```

---

### Phase 4: Analytics + Error Reporting
> **עדיפות: בינוני** | **משך: 3-5 ימים**

#### 4.1 Error Reporting

**ספרייה:** Sentry (חינם עד 5K events/חודש)

```javascript
// electron/main.js
const Sentry = require('@sentry/electron');
Sentry.init({ dsn: 'https://xxx@sentry.io/xxx' });
```

```python
# backend/server.py
import sentry_sdk
sentry_sdk.init(dsn="https://xxx@sentry.io/xxx")
```

#### 4.2 Usage Analytics

**ספרייה:** PostHog (open source, self-hostable) או Mixpanel

**אירועים לעקוב:**
```
app_opened              — פתיחת אפליקציה
session_started         — התחלת שיחה
session_duration        — משך שיחה
tool_used               — שימוש בכלי (CAD, Web, Kasa...)
cad_generated           — יצירת מודל 3D
web_agent_task          — משימת Web Agent
printer_connected       — חיבור מדפסת
error_occurred          — שגיאה
plan_upgraded           — שדרוג plan
feature_toggled         — שינוי הגדרה
```

#### 4.3 Privacy Mode

כמו Cursor:
- **Privacy Mode OFF (default Free/Pro):** telemetry + usage data
- **Privacy Mode ON:** zero data retention, רק billing counters
- **Business plan:** Privacy Mode enforced

---

### Phase 5: Branding + Product Polish
> **עדיפות: גבוה** | **משך: 1-2 שבועות**

#### 5.1 Visual Identity

- **Logo** — עיצוב לוגו מקצועי (אפשר להשתמש ב-AI + מעצב)
- **App Icon** — icon ייעודי ל-Desktop (לא ה-Electron default)
- **Splash Screen** — מסך טעינה עם לוגו ו-loading bar
- **Color Palette** — כבר יש (Teal/Violet theme) — לתעד ולהגדיר כ-design system

#### 5.2 Landing Page

- **כתובת:** dvirious.com (או dvirious.ai)
- **מבנה:** Hero → Features → Pricing → Download → Docs
- **טכנולוגיה:** Next.js + Vercel (deploy בדקות)

#### 5.3 Login Screen (מחליף את Setup Wizard)

```
┌─────────────────────────────────────┐
│                                     │
│         Welcome to Dvirious         │
│                                     │
│    ┌─────────────────────────┐      │
│    │   Continue with Google  │      │
│    └─────────────────────────┘      │
│    ┌─────────────────────────┐      │
│    │   Continue with GitHub  │      │
│    └─────────────────────────┘      │
│    ┌─────────────────────────┐      │
│    │   Sign up with Email    │      │
│    └─────────────────────────┘      │
│                                     │
│    Already have an account? Login   │
│                                     │
│         Free plan • No CC needed    │
│                                     │
└─────────────────────────────────────┘
```

#### 5.4 In-App Plan Status

```
┌──────────────────────────────────────────┐
│  ⚡ Free Plan  •  12/30 min used today   │
│  [Upgrade to Pro — $20/mo]               │
└──────────────────────────────────────────┘
```

---

### Phase 6: Platform Expansion
> **עדיפות: עתידי** | **משך: 2-4 שבועות**

- **macOS Build** — Electron כבר cross-platform, צריך לתקן code signing
- **Linux Build** — AppImage / .deb
- **Mobile Companion** (אופציונלי) — React Native / PWA
- **Web Version** (אופציונלי) — כמו ChatGPT web, ללא desktop features

---

## Tech Stack Summary — מוצר מסחרי

| שכבה | טכנולוגיה | תפקיד |
|---|---|---|
| **Desktop** | Electron + React + TailwindCSS | אפליקציה ראשית |
| **Local Backend** | Python (Audio, CAD, Printers, Kasa) | עיבוד מקומי |
| **Cloud API** | FastAPI (Python) on Railway/Vercel | Auth proxy, AI proxy, billing |
| **Auth** | Supabase Auth | OAuth, JWT, user management |
| **Database** | Supabase PostgreSQL | Users, plans, usage logs |
| **Billing** | Polar | Subscriptions, payments |
| **AI Models** | Gemini Live API (primary), Claude/GPT (future) | השיחה והכלים |
| **Updates** | electron-updater + GitHub Releases | Auto-update |
| **Error Tracking** | Sentry | Crash reporting |
| **Analytics** | PostHog / Mixpanel | Usage analytics |
| **CI/CD** | GitHub Actions | Build + Release automation |
| **Landing Page** | Next.js + Vercel | Marketing site |
| **CDN** | Cloudflare | Security + performance |

---

## סדר עדיפויות מומלץ

```
Phase 1: Auth + Cloud Backend     ████████████████████  [שבועות 1-3]
Phase 2: Billing + Polar         ██████████            [שבועות 3-5]
Phase 5: Branding + Polish        ██████████            [שבועות 3-5] (parallel)
Phase 3: Auto-Updates             █████                 [שבוע 5-6]
Phase 4: Analytics                ████                  [שבוע 6-7]
Phase 6: Platform Expansion       ████████              [שבוע 8+]
```

> **MVP מסחרי (6-7 שבועות):** Auth + Billing + Auto-Updates + Branding
> **הכל (10+ שבועות):** כולל analytics, multi-platform, docs

---

## סיכונים ונקודות לתשומת לב

| סיכון | פתרון |
|---|---|
| **Gemini Live API לא תומך ב-proxy קל** | Temporary credentials / signed tokens |
| **עלויות API** | Rate limiting, usage caps, credit system |
| **Privacy/GDPR** | Privacy mode, data retention policy, terms of service |
| **Code signing (Windows/Mac)** | Certificate from DigiCert / Apple Developer ($99-300/שנה) |
| **Piracy** | Server-side license validation, no offline mode without auth |
| **Scalability** | Start with Supabase free tier, scale up as users grow |

---

## צעד ראשון

> **התחל מ-Phase 1.1:** הקמת Cloud Backend בסיסי עם Supabase Auth.
> ברגע שיש login שעובד, כל השאר נבנה מעליו.
