-- =====================================================================
-- DailyGains Cybertech Gym Workout Monitoring Database Schema
-- Target: MySQL / MariaDB (XAMPP default localhost)
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

-- 3. REMINDERS / ALARMS TABLE
CREATE TABLE IF NOT EXISTS `reminders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100) NOT NULL DEFAULT 'Cyber Protocol Activation',
    `time` VARCHAR(10) NOT NULL DEFAULT '07:00',
    `days` VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    `sound` VARCHAR(50) NOT NULL DEFAULT 'cyber-siren',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SEED DATA: CYBERTECH EXERCISE CATALOG
INSERT INTO `exercises` (`name`, `category`, `target_muscle`, `equipment`, `icon`, `description`) 
SELECT * FROM (
    SELECT 'Quantum Bench Press', 'Strength', 'Chest', 'Barbell', 'dumbbell', 'Heavy kinetic chest pressing for pectoral fiber synthesis.' UNION ALL
    SELECT 'Cyber Deadlift', 'Powerlifting', 'Back', 'Barbell', 'zap', 'Posterior chain recruitment and spinal stabilizer overload.' UNION ALL
    SELECT 'Overclock Squats', 'Strength', 'Legs', 'Barbell', 'activity', 'High-voltage quadricep and glute hypertrophy activation.' UNION ALL
    SELECT 'Neural Lat Pulldowns', 'Hypertrophy', 'Back', 'Cable', 'trending-up', 'Targeted lats latissimus dorsi mechanical contraction.' UNION ALL
    SELECT 'Bionic Bicep Curls', 'Isolation', 'Arms', 'Dumbbell', 'shield', 'Peak bicep tension with alternating rotation lock.' UNION ALL
    SELECT 'Tricep Plasma Pushdowns', 'Isolation', 'Arms', 'Cable', 'zap', 'Lockout tricep horseshoe development.' UNION ALL
    SELECT 'Plasma Shoulder Press', 'Hypertrophy', 'Shoulders', 'Dumbbell', 'dumbbell', 'Deltoid kinetic press for cyber-silhouette width.' UNION ALL
    SELECT 'Core Overdrive Planks', 'Endurance', 'Core', 'Bodyweight', 'shield', 'Isometric abdominal wall stabilizer endurance test.' UNION ALL
    SELECT 'Hyperdrive HIIT Sprints', 'Cardio', 'Cardio', 'Treadmill', 'flame', 'Maximum VO2 surge protocol for mitochondrial acceleration.' UNION ALL
    SELECT 'Titan Leg Press', 'Hypertrophy', 'Legs', 'Machine', 'activity', 'High-load closed kinetic chain leg press.'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `exercises` LIMIT 1);

-- 5. SEED DATA: SAMPLE PROTOCOL REMINDER
INSERT INTO `reminders` (`title`, `time`, `days`, `sound`, `is_active`)
SELECT '06:00 AM Hypertrophy Protocol', '06:00', 'Mon,Tue,Wed,Thu,Fri', 'cyber-siren', 1
WHERE NOT EXISTS (SELECT 1 FROM `reminders` LIMIT 1);
