# Jarvis - Personal AI Assistant

> **עוזר אישי חכם מבוסס בינה מלאכותית עם שליטה קולית, ראייה ממוחשבת וכלי אוטומציה מתקדמים.**

---

## תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [ארכיטקטורה](#ארכיטקטורה)
- [מבנה הקבצים](#מבנה-הקבצים)
  - [Backend (Python)](#backend-python)
  - [Frontend (React)](#frontend-react)
  - [Electron](#electron)
  - [קבצי הגדרות](#קבצי-הגדרות)
- [כלי AI זמינים](#כלי-ai-זמינים)
- [תכונות עיקריות](#תכונות-עיקריות)
- [הפעלה](#הפעלה)

---

## סקירה כללית

Jarvis הוא עוזר אישי בסגנון Jarvis (מעולם Iron Man), שפועל כאפליקציית Desktop עם יכולות שיחה קולית בזמן אמת, ראייה ממוחשבת, שליטה בבית חכם, הדפסה תלת-ממדית, גלישה אוטונומית באינטרנט ועוד.

המערכת בנויה כאפליקציית Electron עם ממשק React מודרני ושרת Python שמנהל את כל הלוגיקה העסקית והתקשורת עם מודל ה-AI.

---

## ארכיטקטורה

```
+------------------------------------------------------+
|                    Electron Shell                     |
|  +--------------------------------------------------+|
|  |              React + Vite + TailwindCSS           ||
|  |                                                    ||
|  |   Visualizer  |  Chat  |  CAD  |  Browser  | ...  ||
|  |                                                    ||
|  +--------------------+-----------------------------+||
|                       |                               |
|                 Socket.IO (WS)                        |
|                       |                               |
|  +--------------------v-----------------------------+|
|  |         FastAPI + Socket.IO Server (:8001)        ||
|  |                                                    ||
|  |   AudioLoop  |  Agents  |  Tools  |  Auth         ||
|  +--------------------+-----------------------------+||
|                       |                               |
|            Gemini Live API (Audio/Video)              |
+------------------------------------------------------+
```

| שכבה | טכנולוגיה | תפקיד |
|---|---|---|
| **Frontend** | React + Vite + TailwindCSS | ממשק משתמש מודולרי עם drag-and-drop |
| **Desktop Shell** | Electron | עטיפת האפליקציה כתוכנת Desktop |
| **Backend** | Python FastAPI + Socket.IO | שרת על port 8001, ניהול לוגיקה ותקשורת |
| **מנוע AI** | Google Gemini Live API | שיחה קולית דו-כיוונית בזמן אמת |
| **מודל** | `gemini-2.5-flash-native-audio-preview` | מודל audio בזמן אמת |
| **תקשורת** | Socket.IO | ערוץ דו-כיווני בין Frontend ל-Backend |

---

## מבנה הקבצים

### Backend (Python)

> השרת והלוגיקה המרכזית של המערכת.

| קובץ | תיאור |
|---|---|
| `backend/ada.py` | **המוח של המערכת.** מחלקת `AudioLoop` -- מנהל את ה-session מול Gemini Live, קלט/פלט אודיו, VAD (Voice Activity Detection), פריימים מהמצלמה, ותזמור קריאות לכלים. |
| `backend/server.py` | שרת FastAPI + Socket.IO. מנתב את כל האירועים מה-Frontend ל-`AudioLoop`. מנהל הגדרות, אימות פנים, וניטור מדפסות. |
| `backend/tools.py` | הגדרות כלים עבור Gemini -- `generate_cad_prototype`, `write_file`, `read_directory`, `read_file` ועוד. |
| `backend/cad_agent.py` | מחלקת `CadAgent` -- שימוש ב-Gemini Pro ליצירת סקריפטים של build123d ב-Python, הרצה מקומית, והפקת קבצי STL. כולל לוגיקת retry (3 ניסיונות) ו-streaming של "חשיבה" ל-Frontend. |
| `backend/web_agent.py` | מחלקת `WebAgent` -- גלישה אוטונומית באינטרנט באמצעות Playwright + מודל Gemini Computer Use. דפדפן Chromium במצב headless. |
| `backend/kasa_agent.py` | מחלקת `KasaAgent` -- שליטה במכשירי בית חכם של TP-Link Kasa (נורות, שקעים, פסי שקעים). תומך בגילוי, הדלקה/כיבוי, בהירות וצבע. |
| `backend/printer_agent.py` | מחלקת `PrinterAgent` -- ניהול מדפסות תלת-ממד. תומך ב-OctoPrint, Moonraker/Klipper, PrusaLink. כולל גילוי (mDNS), חיתוך (OrcaSlicer CLI), העלאה, שליחת עבודות הדפסה וניטור סטטוס. |
| `backend/authenticator.py` | מחלקת `FaceAuthenticator` -- זיהוי פנים באמצעות MediaPipe Face Landmarker למסך נעילה. |
| `backend/project_manager.py` | מחלקת `ProjectManager` -- ארגון קבצים, artifacts של CAD, והיסטוריית צ'אט בתיקיות פרויקט תחת `projects/`. |

---

### Frontend (React)

> ממשק המשתמש -- מודולרי, ניתן לגרירה, עם אנימציות ותצוגות מרובות.

#### רכיבים ראשיים

| קובץ | תיאור |
|---|---|
| `src/App.jsx` | **רכיב ראשי.** ניהול כל ה-state, חיבור Socket, מעקב ידיים (MediaPipe), layout מודולרי עם drag-and-drop, streaming וידאו ל-Backend. |
| `src/components/ChatModule.jsx` | חלון צ'אט -- מציג 5 הודעות אחרונות עם עיצוב ייחודי ל-AI / User / System. |
| `src/components/Visualizer.jsx` | עיגול מונפש (אנימציית "נשימה" ב-idle, פעימה בדיבור) עם שם ה-AI במרכז. |
| `src/components/TopAudioBar.jsx` | ויזואליזציה של תדרי אודיו בחלק העליון של המסך. |

#### חלונות כלים

| קובץ | תיאור |
|---|---|
| `src/components/ToolsModule.jsx` | סרגל כלים צף -- כפתורים: Power, Mute, Video, Settings, Hand tracking, Kasa, Browser. |
| `src/components/CadWindow.jsx` | צופה CAD תלת-ממדי באמצעות Three.js + STL loader. תומך ביצירה חדשה, איטרציה, והדפסה. מציג פאנל "חשיבה" בזמן יצירה. |
| `src/components/BrowserWindow.jsx` | תצוגת Web Agent -- צילומי מסך, לוגים, ושורת פקודות. |
| `src/components/KasaWindow.jsx` | פאנל שליטה בבית חכם -- גילוי מכשירים, הדלקה/כיבוי, בהירות, גלגל צבעים. |
| `src/components/PrinterWindow.jsx` | ניהול מדפסות תלת-ממד -- הוספה, גילוי, עבודות הדפסה, סטטוס. |

#### רכיבי מערכת

| קובץ | תיאור |
|---|---|
| `src/components/SettingsWindow.jsx` | פאנל הגדרות -- אימות פנים, שמות אישיים, בחירת מיקרופון/רמקול/מצלמה, רגישות סמן, הרשאות כלים, העלאת זיכרון. |
| `src/components/SetupWizard.jsx` | אשף הגדרה ראשונית -- שם משתמש, שם AI, מפתח API. |
| `src/components/AuthLock.jsx` | מסך נעילה עם זיהוי פנים ואנימציית סריקה. |
| `src/components/ConfirmationPopup.jsx` | חלון אישור לפני הפעלת כלי AI. |
| `src/components/MemoryPrompt.jsx` | שמירת זיכרון ושיחות. |

---

### Electron

| קובץ | תיאור |
|---|---|
| `electron/main.js` | יצירת `BrowserWindow`, הפעלת תהליך Python ב-background, ניהול חלון (minimize, maximize, close), המתנה ל-Backend ready. |
| `electron/launch.js` | Launcher שמסיר את משתנה הסביבה `ELECTRON_RUN_AS_NODE` לתאימות עם VSCode. |

---

### קבצי הגדרות

| קובץ | תיאור |
|---|---|
| `settings.json` | הגדרות runtime -- שם משתמש, שם AI, סטטוס setup, אימות פנים, הרשאות כלים, מדפסות, מכשירי Kasa, היפוך מצלמה. |
| `.env` | מפתח API של Gemini (`GEMINI_API_KEY`). |
| `package.json` | הגדרות npm ו-Electron Builder. |
| `requirements.txt` | תלויות Python. |

---

## כלי AI זמינים

> כלים ש-Gemini יכול להפעיל במהלך שיחה עם המשתמש.

### עיצוב והדפסה תלת-ממדית

| כלי | תיאור |
|---|---|
| `generate_cad` | יצירת מודל CAD תלת-ממדי מתיאור טקסטואלי |
| `iterate_cad` | שינוי עיצוב CAD קיים |
| `discover_printers` | גילוי מדפסות תלת-ממד ברשת |
| `print_stl` | שליחת קובץ STL להדפסה |
| `get_print_status` | בדיקת סטטוס הדפסה |

### קבצים ופרויקטים

| כלי | תיאור |
|---|---|
| `write_file` | כתיבת קובץ למערכת הקבצים |
| `read_file` | קריאת קובץ ממערכת הקבצים |
| `read_directory` | קריאת תוכן תיקייה |
| `create_project` | יצירת פרויקט חדש |
| `switch_project` | מעבר בין פרויקטים |
| `list_projects` | הצגת רשימת פרויקטים |

### גלישה ואוטומציה

| כלי | תיאור |
|---|---|
| `run_web_agent` | גלישה אוטונומית באינטרנט |
| `run_command` | הרצת פקודות מערכת (מושבת כברירת מחדל) |

### בית חכם

| כלי | תיאור |
|---|---|
| `list_smart_devices` | הצגת מכשירים חכמים ברשת |
| `control_light` | שליטה בתאורה חכמה (הדלקה, כיבוי, בהירות, צבע) |

### נוסף

| כלי | תיאור |
|---|---|
| Google Search | חיפוש מובנה באינטרנט |

---

## תכונות עיקריות

### שיחה קולית בזמן אמת
- streaming אודיו דו-כיווני עם Gemini Live API
- תמלול קלט ופלט מוצג בצ'אט
- VAD -- שליחת פריים מהמצלמה כשזוהה דיבור

### ממשק משתמש מודולרי
- כל החלונות ניתנים לגרירה ומיקום מחדש (drag-and-drop)
- ויזואליזציה מונפשת של אודיו ומצב ה-AI
- עיצוב מודרני עם TailwindCSS

### שליטה במחוות ידיים
- מעקב ידיים באמצעות MediaPipe
- שליטה בסמן העכבר באמצעות תנועות יד

### אבטחה
- מסך נעילה עם זיהוי פנים (אופציונלי)
- מערכת אישור כלים -- המשתמש יכול לאשר או לדחות שימוש בכלי AI
- הרשאות כלים ניתנות להגדרה

### ניהול פרויקטים
- ארגון קבצים ו-artifacts בתיקיות פרויקט
- שמירת היסטוריית צ'אט

### חוסן ויציבות
- auto-reconnect עם retry backoff בנפילת session
- שמירת הגדרות בקובץ JSON
- אשף הגדרה ראשונית למשתמשים חדשים

---

## הפעלה

### דרישות מוקדמות

- **Node.js** (גרסה 18+)
- **Python** (גרסה 3.10+)
- **מפתח API של Gemini** (מ-Google AI Studio)

### התקנת תלויות

```bash
# התקנת תלויות Node
npm install

# התקנת תלויות Python
pip install -r requirements.txt
```

### הגדרת משתני סביבה

יש ליצור קובץ `.env` בתיקייה הראשית:

```env
GEMINI_API_KEY=your_api_key_here
```

### הרצה במצב פיתוח

```bash
npm run dev
```

> מריץ את Vite ו-Electron במקביל (concurrently).

### בנייה להפצה

```bash
npm run dist
```

> בונה אפליקציה ל-Windows.

---

<div align="center">

**Jarvis** -- עוזר אישי חכם שמקשיב, רואה, ויוצר.

</div>
