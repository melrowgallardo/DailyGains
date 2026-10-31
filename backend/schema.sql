-- =====================================================================
-- DailyGains Cybertech Gym Workout Monitoring Database Schema
-- Target: MySQL / MariaDB (XAMPP default localhost:3306)
-- Database Name: dailygains
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `dailygains` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dailygains`;

-- 1. EXERCISES TABLE
CREATE TABLE IF NOT EXISTS `exercises` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'Strength',
    `target_muscle` VARCHAR(50) NOT NULL DEFAULT 'Full Body',
    `equipment` VARCHAR(50) NOT NULL DEFAULT 'Barbell',
    `icon` VARCHAR(50) DEFAULT 'dumbbell',
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. WORKOUT LOGS TABLE
CREATE TABLE IF NOT EXISTS `workout_logs` (
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
    INDEX `idx_logged_at` (`logged_at`),
    INDEX `idx_exercise_id` (`exercise_id`),
    CONSTRAINT `fk_log_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. REMINDERS / PROTOCOL ALARMS TABLE
CREATE TABLE IF NOT EXISTS `reminders` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USER METRICS & BMI TABLE
CREATE TABLE IF NOT EXISTS `user_metrics` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `age` INT NOT NULL DEFAULT 25,
    `height_cm` DECIMAL(6,2) NOT NULL DEFAULT 175.00,
    `weight_kg` DECIMAL(6,2) NOT NULL DEFAULT 70.00,
    `bmi_value` DECIMAL(4,1) NOT NULL DEFAULT 22.9,
    `bmi_status` VARCHAR(50) NOT NULL DEFAULT 'Normal',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. USER PROFILE & APP PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS `user_profile` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(100) NOT NULL DEFAULT 'Athlete',
    `age` INT NOT NULL DEFAULT 25,
    `fitness_goal` VARCHAR(100) NOT NULL DEFAULT 'Muscle Gain',
    `preferred_unit` VARCHAR(20) NOT NULL DEFAULT 'metric',
    `sound_enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `sound_type` VARCHAR(50) NOT NULL DEFAULT 'modern-chime',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- NOTE: Automatic sample data seeding has been disabled.
-- All database tables are created empty without auto-populating initial rows.
-- Users will start with clean tables and populate them through the app.
-- =====================================================================

