# Anonymous Student Emotion Trend System - Design Specification

## 1. System Architecture

### Overview
The system is a privacy-first web application designed to track emotional trends on campus without compromising student identity. It uses a client-side anonymous ID generation mechanism and a server-side SQLite database (simulated in prototype) to store encrypted/anonymous logs.

### Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React Icons.
- **Backend (Prototype)**: In-memory `MockBackend` simulating SQLite queries.
- **AI Engine**: Google Gemini (replacing DistilBERT for prototype ease) for sentiment analysis and pattern recognition.
- **Database**: SQLite (Schema defined below).

### Color Palette (Calm Psychological Design)
- **Soft Blue**: `#6DAEDB` (Primary Action, Calm)
- **Soft Green**: `#AEE1C9` (Success, Growth)
- **Lavender**: `#C5B4E3` (Insight, Reflection)
- **Off-White**: `#F9FAFB` (Background, Neutrality)
- **Charcoal**: `#1F1F1F` (Text, Contrast)

---

## 2. Database Schema (SQLite)

### Table: `students`
| Column | Type | Description |
|--------|------|-------------|
| `anonymous_id` | TEXT | Primary Key. UUID generated on client. |
| `created_at` | DATETIME | Timestamp of first login. |

### Table: `mood_logs`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary Key (Auto-increment). |
| `student_id` | TEXT | Foreign Key -> students.anonymous_id. |
| `timestamp` | DATETIME | Time of log. |
| `mood_score` | INTEGER | 1-5 scale (Slider). |
| `stress_level` | INTEGER | 1-5 scale. |
| `energy_level` | INTEGER | 1-5 scale. |
| `sleep_quality` | INTEGER | 1-5 scale. |
| `journal_text` | TEXT | "How are you feeling today?" |
| `ai_sentiment` | TEXT | Classified emotion (e.g., "Anxious"). |
| `ai_keywords` | TEXT | Extracted keywords. |

### Table: `weekly_reports`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary Key. |
| `week_start` | DATE | Start date of the report. |
| `student_id` | TEXT | Foreign Key (Anonymous). |
| `trend_summary` | TEXT | AI-generated summary of the week. |
| `dominant_emotion`| TEXT | Most frequent emotion. |
| `stress_peak` | BOOLEAN | True if stress > 4 for > 3 days. |
| `suggestion_id` | TEXT | ID of generated suggestion package. |

---

## 3. Logic & Algorithms

### AI Sentiment Analysis (Gemini Prompt)
**Input**: Journal text + Mood Score + Stress/Energy/Sleep levels.
**Task**:
1. Classify into: `Happy`, `Neutral`, `Sad`, `Anxious`, `Stressed`, `Angry`, `Low-Energy`.
2. Extract key stressors (e.g., "Exams", "Social", "Insomnia").
3. Generate a 1-sentence insight.

### Suggestion Engine (Rule-Based + AI)
The engine maps **Dominant Trends** to **Activity Packages**.

| Trend Condition | Daily Micro-Activity | Weekly Macro-Activity | Monthly Event |
|-----------------|----------------------|-----------------------|---------------|
| **High Stress** | Breathing Session (5m) | Yoga Morning | Time-Mgmt Workshop |
| **Low Energy** | Hydration Reminder | Healthy Breakfast | Sports Tournament |
| **Anxious** | Quiet Library Hour | Mindfulness Walk | Psych Awareness Day |
| **Sad/Lonely** | Gratitude Wall | Movie Night | Bonding Festival |
| **Angry** | Stretch-Break | Sports Evening | Art Exhibition |
| **Happy/Good** | Positive Note Board | Open Mic Night | Motivational Speaker |

---

## 4. UI/UX Structure

### A. Student Login (Anonymous)
- **Action**: "Enter Sanctuary"
- **Logic**: Checks `localStorage` for `student_id`. If none, generates UUID.
- **Visual**: Clean, minimal, reassuring text.

### B. Student Feed (Private)
1.  **Mood Form**:
    -   Text Area: "How are you feeling today?"
    -   Sliders (1-5): Mood, Stress, Energy, Sleep.
    -   Submit Button: "Log Reflection".
2.  **Stats Page**:
    -   7-Day Trend Graph (Line chart).
    -   Sentiment Distribution (Pie/Bar).
    -   AI Insight Card.

### C. University Dashboard (Aggregated)
-   **Weekly Reports Feed**: List of anonymous summaries (e.g., "Student #8f2a: High stress detected due to exams.").
-   **Campus Pulse**: Aggregate average mood, top stressor.
-   **Action Plan**: Suggested activities for the campus based on aggregate data.
-   **Download**: PDF Report button.

### D. Admin Dashboard
-   **System Config**: Toggle registration, clear database.
-   **User Management**: Manage University staff credentials.

---

## 5. Component Definitions (React)

-   `MoodForm`: Handles multi-input state and submission.
-   `StatsChart`: Reusable SVG chart for trends.
-   `SuggestionCard`: Displays the Daily/Weekly/Monthly activities.
-   `ReportCard`: Displays the anonymous weekly report.
-   `GlassContainer`: Wrapper for glassmorphism styling.
