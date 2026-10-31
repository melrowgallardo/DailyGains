# DailyGains // Cybertech Gym Workout Monitoring System

![DailyGains Cyborg Mascot](/Logo.jpg)

**DailyGains** is a high-performance Cybertech/Cyberpunk Gym Workout Monitoring HUD built with a modern React frontend and a PHP XAMPP MySQL backend.

---

## ⚡ Core Features & Highlights

### 1. Cybertech / Cyberpunk Gym Aesthetic
- **Visual Palette**: Neon Cyan (`#00f3ff`), Electric Orange (`#ff6400`), and Dark Chrome Slate (`#020617`).
- **High-Contrast Dual Mode**: Cyberpunk Dark Mode (default) and High-Tech Lab Light Mode toggle.
- **Custom Cyber Graphics**: High-res cyborg biomechanical mascot and animated HUD borders.
- **Synthesized Web Audio**: Built-in 16-bit futuristic sound effects (alarms, heartbeats, countdown beeps, success fanfare) powered by Web Audio API — zero external audio dependencies.

### 2. Interactive Telemetry Widgets
- **Biometric Pulse HUD Meter**: Real-time EKG wave animated on HTML5 canvas with phosphor decay trail, interactive BPM intensity slider, cardiac efficiency output, and zone color transitions.
- **Session Chronometer & Interval Timer**: Live stopwatch with millisecond precision, active caloric surge estimator, and quick inter-set rest countdown timer (30s, 60s, 90s, 120s) with audio alert beepers.
- **Cyber Streak & Discipline Matrix**: Consecutive workout streak tracker, Cyber Titan rank levels, and an interactive 7-day synchronization checklist.
- **Volume & Calorie Furnace**: Real-time tonnage calculation (Weight × Sets × Reps), caloric output progression bar, and total sets ticker.
- **7-Day Gains Telemetry Bar Chart**: Interactive responsive SVG bar chart with toggleable metrics (Volume in KG, Calories in KCAL, Total Sets) and glowing hover tooltips.

### 3. Workout Tracker & Exercise Forge
- **Protocol Execution Logging**: Record exercise, sets, reps, weight load (with KG/LBS toggle & quick ±1.25/2.5/5/10 steppers), duration, calories burned, RPE slider (1–10), and execution notes.
- **Exercise Module Forge**: Create custom exercises with category (Strength, Hypertrophy, Powerlifting, Isolation, Cardio, Endurance), target muscle group, equipment apparatus, and biomechanical description.
- **Real-Time History Feed**: Filterable by muscle group and search query with delete actions and instant MySQL persistence.
- **Cyber Confetti Celebration**: Dynamic particle celebrations upon logging successful sets.

### 4. Daily Alarms & Protocol Reminders
- **Protocol Scheduler**: Schedule recurring daily workout alarms (e.g., `06:30`, `18:00`).
- **Protocol Days Toggle**: Flexible recurring days selector (Mon–Sun).
- **Synthesized Audio Alarm Tones**: Cyber Siren, Pulse Alarm, High-Voltage Chime, Quantum Ping, Drill Sergeant Buzzer.
- **Live Background Listener**: In-app real-time alarm trigger modal with sound alert and HTML5 browser push notification support.

### 5. Gains Analytics
- **Volume KPIs**: Aggregate tonnage lifted, caloric expenditure, total sets, and mean RPE.
- **Muscle Recruitment Split**: Percentage and tonnage distribution across Chest, Back, Legs, Shoulders, Arms, Core, and Cardio.
- **Personal Records (PR) Hall of Fame**: Dynamic high-score leaderboard tracking maximum load achieved per exercise with rank badges.

### 6. System Settings & MySQL Bridge
- **Endpoint Config**: Configurable REST API URL (defaults to `http://localhost/dailygains/api.php`).
- **Live Diagnostic Tester**: Tests connection latency, database status, and record counts.
- **Dual-Storage Resilience**: Works seamlessly online with MySQL, with automatic fallback to LocalStorage if offline or XAMPP is paused.
- **1-Click Sync**: Batch push local offline logs to MySQL in a single transaction.
- **Schema Viewer & Exporter**: In-app SQL inspector, copy-to-clipboard, and `schema.sql` download.

---

## 🚀 Quick Start Guide

### 1. Backend (PHP + XAMPP MySQL)
The backend REST API and database schema are ready in the `backend/` directory and also pre-installed into your XAMPP `htdocs`:
- Location in XAMPP: `C:\Users\Acer\xampp\htdocs\dailygains\api.php`
- Database Name: `dailygains`
- Auto-Migration: `api.php` automatically connects to MySQL `localhost:3306` (user: `root`, password: `""`), creates database `dailygains` if missing, initializes tables, and seeds starter exercises!

To test the backend API:
```bash
curl.exe -s http://localhost/dailygains/api.php?action=status
```

### 2. Frontend (React + Vite)
From `c:\Meroy\DailyGains\frontend`:
```bash
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 🗄️ MySQL Database Architecture

```sql
-- 1. EXERCISES
CREATE TABLE `exercises` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'Strength',
    `target_muscle` VARCHAR(50) NOT NULL DEFAULT 'Full Body',
    `equipment` VARCHAR(50) NOT NULL DEFAULT 'Barbell',
    `icon` VARCHAR(50) DEFAULT 'dumbbell',
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. WORKOUT LOGS
CREATE TABLE `workout_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `exercise_id` INT NULL,
    `exercise_name` VARCHAR(100) NOT NULL,
    `sets` INT NOT NULL DEFAULT 1,
    `reps` INT NOT NULL DEFAULT 10,
    `weight` DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    `weight_unit` VARCHAR(10) NOT NULL DEFAULT 'kg',
    `duration_minutes` INT NOT NULL DEFAULT 0,
    `calories_burned` INT NOT NULL DEFAULT 0,
    `rpe` INT NOT NULL DEFAULT 8,
    `notes` TEXT NULL,
    `logged_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_logged_at` (`logged_at`)
);

-- 3. REMINDERS / PROTOCOL ALARMS
CREATE TABLE `reminders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `exercise_name` VARCHAR(100) NOT NULL DEFAULT 'Workout Protocol',
    `duration_value` INT NOT NULL DEFAULT 30,
    `duration_unit` VARCHAR(20) NOT NULL DEFAULT 'minutes',
    `weeks_duration` INT NOT NULL DEFAULT 4,
    `is_today_only` TINYINT(1) NOT NULL DEFAULT 0,
    `target_date` DATE NULL,
    `reminder_time` VARCHAR(10) NOT NULL DEFAULT '08:00',
    `days_of_week` VARCHAR(100) NOT NULL DEFAULT 'Mon,Wed,Fri',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. USER METRICS & BMI
CREATE TABLE `user_metrics` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `height_cm` DECIMAL(6,2) NOT NULL DEFAULT 175.00,
    `weight_kg` DECIMAL(6,2) NOT NULL DEFAULT 70.00,
    `bmi_value` DECIMAL(4,1) NOT NULL DEFAULT 22.9,
    `bmi_status` VARCHAR(50) NOT NULL DEFAULT 'Normal',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🌐 REST API Specification (`api.php`)

| Method | Endpoint | Query / Action | Description |
|---|---|---|---|
| `GET` | `/api.php?action=status` | `status` | Checks database health, server time, PHP version, and record statistics |
| `GET` | `/api.php?action=exercises` | `exercises` | Retrieves all exercise modules |
| `POST` | `/api.php?action=exercises` | `exercises` | Creates a new custom exercise module |
| `DELETE` | `/api.php?action=exercises&id={id}` | `exercises` | Deletes an exercise module |
| `GET` | `/api.php?action=logs` | `logs` | Retrieves logged workout executions ordered by date |
| `POST` | `/api.php?action=logs` | `logs` | Records a new workout set execution |
| `DELETE` | `/api.php?action=logs&id={id}` | `logs` | Deletes a workout execution record |
| `GET` | `/api.php?action=reminders` | `reminders` | Retrieves all scheduled workout protocol alarms (`exercise_name`, `reminder_time`, `days`, `is_active`) |
| `POST` | `/api.php?action=reminders` | `reminders` | Creates or updates an exercise reminder protocol |
| `DELETE` | `/api.php?action=reminders&id={id}` | `reminders` | Deletes a protocol reminder |
| `GET` | `/api.php?action=user_metrics` | `user_metrics` | Retrieves the latest biometric morphometry and BMI calculations |
| `POST` | `/api.php?action=user_metrics` | `user_metrics` | Saves/syncs user height, weight, BMI value, and BMI status |
| `POST` | `/api.php?action=sync` | `sync` | Atomically bulk-syncs local buffer logs into MySQL |
