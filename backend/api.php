<?php
/**
 * DailyGains Cybertech Gym Workout Monitoring API
 * Backend REST API for PHP + XAMPP MySQL
 * 
 * Supports: GET, POST, DELETE, OPTIONS
 * Default DB: dailygains (Auto-created if absent)
 * Authentication: None (Open Cybertech Local/Intranet Access)
 */

// Enable error logging while returning clean JSON
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Handle HTTP preflight OPTIONS request
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration (Standard XAMPP default)
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$dbName = getenv('DB_NAME') ?: 'dailygains';
$dbPort = getenv('DB_PORT') ?: 3306;

function sendResponse($status, $data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

// Establish PDO connection with auto-provisioning
try {
    // First connect to MySQL server without selecting DB to ensure DB exists
    $dsnServer = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
    $pdoServer = new PDO($dsnServer, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Auto-create database if not existing
    $pdoServer->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // Now connect to dailygains database
    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Ensure tables exist (auto migration)
    initDatabaseTables($pdo);

} catch (PDOException $e) {
    sendResponse('error', null, 'Database connection failed: ' . $e->getMessage(), 500);
}

function initDatabaseTables($pdo) {
    // 1. Exercises table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `exercises` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `category` VARCHAR(50) NOT NULL DEFAULT 'Strength',
        `target_muscle` VARCHAR(50) NOT NULL DEFAULT 'Full Body',
        `equipment` VARCHAR(50) NOT NULL DEFAULT 'Barbell',
        `icon` VARCHAR(50) DEFAULT 'dumbbell',
        `description` VARCHAR(255) NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 2. Workout logs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `workout_logs` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 3. Reminders table (id, exercise_name, duration_value, duration_unit, weeks_duration, is_today_only, target_date, reminder_time, days_of_week, is_active, created_at)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `reminders` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Migration check for reminders table if upgraded from legacy schema
    try {
        $colsStmt = $pdo->query("SHOW COLUMNS FROM `reminders`");
        $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN, 0);

        if (!in_array('exercise_name', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `exercise_name` VARCHAR(100) NOT NULL DEFAULT 'Workout Protocol' AFTER `id`");
            if (in_array('title', $cols)) {
                $pdo->exec("UPDATE `reminders` SET `exercise_name` = `title` WHERE `title` IS NOT NULL AND `title` != ''");
            }
        }
        if (!in_array('duration_value', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `duration_value` INT NOT NULL DEFAULT 30 AFTER `exercise_name`");
        }
        if (!in_array('duration_unit', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `duration_unit` VARCHAR(20) NOT NULL DEFAULT 'minutes' AFTER `duration_value`");
        }
        if (!in_array('weeks_duration', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `weeks_duration` INT NOT NULL DEFAULT 4 AFTER `duration_unit`");
        }
        if (!in_array('is_today_only', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `is_today_only` TINYINT(1) NOT NULL DEFAULT 0 AFTER `weeks_duration`");
        }
        if (!in_array('target_date', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `target_date` DATE NULL AFTER `is_today_only`");
        }
        if (!in_array('reminder_time', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `reminder_time` VARCHAR(10) NOT NULL DEFAULT '08:00' AFTER `target_date`");
            if (in_array('time', $cols)) {
                $pdo->exec("UPDATE `reminders` SET `reminder_time` = `time` WHERE `time` IS NOT NULL AND `time` != ''");
            }
        }
        if (!in_array('days_of_week', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `days_of_week` VARCHAR(100) NOT NULL DEFAULT 'Mon,Wed,Fri' AFTER `reminder_time`");
            if (in_array('days', $cols)) {
                $pdo->exec("UPDATE `reminders` SET `days_of_week` = `days` WHERE `days` IS NOT NULL AND `days` != ''");
            }
        }
        if (!in_array('is_active', $cols)) {
            $pdo->exec("ALTER TABLE `reminders` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `days_of_week`");
        }
    } catch (Exception $e) {
        // Table created fresh or migration not needed
    }

    // 4. User Metrics & BMI table (id, age, height_cm, weight_kg, bmi_value, bmi_status, updated_at)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `user_metrics` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `age` INT NOT NULL DEFAULT 25,
        `height_cm` DECIMAL(6,2) NOT NULL DEFAULT 175.00,
        `weight_kg` DECIMAL(6,2) NOT NULL DEFAULT 70.00,
        `bmi_value` DECIMAL(4,1) NOT NULL DEFAULT 22.9,
        `bmi_status` VARCHAR(50) NOT NULL DEFAULT 'Normal',
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 5. User Profile & App Preferences table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `user_profile` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_name` VARCHAR(100) NOT NULL DEFAULT 'Athlete',
        `age` INT NOT NULL DEFAULT 25,
        `fitness_goal` VARCHAR(100) NOT NULL DEFAULT 'Muscle Gain',
        `preferred_unit` VARCHAR(20) NOT NULL DEFAULT 'metric',
        `sound_enabled` TINYINT(1) NOT NULL DEFAULT 1,
        `sound_type` VARCHAR(50) NOT NULL DEFAULT 'modern-chime',
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Dynamic schema migrations for existing tables
    try {
        $metricCols = $pdo->query("DESCRIBE `user_metrics`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('age', $metricCols)) {
            $pdo->exec("ALTER TABLE `user_metrics` ADD COLUMN `age` INT NOT NULL DEFAULT 25 AFTER `id`");
        }
    } catch (Exception $e) {}

    try {
        $profileCols = $pdo->query("DESCRIBE `user_profile`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('age', $profileCols)) {
            $pdo->exec("ALTER TABLE `user_profile` ADD COLUMN `age` INT NOT NULL DEFAULT 25 AFTER `user_name`");
        }
    } catch (Exception $e) {}

    // NOTE: Automatic sample data seeding has been disabled upon table initialization.
    // All tables (exercises, reminders, workout_logs, user_metrics, user_profile)
    // are created empty (CREATE TABLE IF NOT EXISTS) without auto-populating initial rows.
}

// Parse request parameters and body
$method = $requestMethod;
$action = $_GET['action'] ?? 'status';

// Read raw JSON input if available
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);
if (!is_array($inputData) && !empty($rawInput)) {
    $inputData = json_decode(stripslashes($rawInput), true);
}
if (!is_array($inputData)) {
    $inputData = $_POST;
}

// ROUTE DISPATCHER
switch ($action) {
    case 'status':
        try {
            $exCount = $pdo->query("SELECT COUNT(*) as c FROM `exercises`")->fetch()['c'];
            $logCount = $pdo->query("SELECT COUNT(*) as c FROM `workout_logs`")->fetch()['c'];
            $remCount = $pdo->query("SELECT COUNT(*) as c FROM `reminders`")->fetch()['c'];
            $metCount = $pdo->query("SELECT COUNT(*) as c FROM `user_metrics`")->fetch()['c'];

            sendResponse('success', [
                'api' => 'DailyGains Cybertech REST API',
                'version' => '2.1.0',
                'connected' => true,
                'database' => $dbName,
                'php_version' => PHP_VERSION,
                'server_time' => date('Y-m-d H:i:s'),
                'counts' => [
                    'exercises' => (int)$exCount,
                    'logs' => (int)$logCount,
                    'reminders' => (int)$remCount,
                    'user_metrics' => (int)$metCount
                ]
            ], 'API and MySQL database connected successfully');
        } catch (Exception $e) {
            sendResponse('error', null, $e->getMessage(), 500);
        }
        break;

    // -------------------------------------------------------------
    // EXERCISES MODULES
    // -------------------------------------------------------------
    case 'exercises':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM `exercises` ORDER BY `name` ASC");
            $exercises = $stmt ? $stmt->fetchAll() : [];
            if (!is_array($exercises)) {
                $exercises = [];
            }
            sendResponse('success', $exercises, 'Exercises retrieved');
        } 
        elseif ($method === 'POST') {
            $name = trim($inputData['name'] ?? '');
            $category = trim($inputData['category'] ?? 'Strength');
            $target_muscle = trim($inputData['target_muscle'] ?? 'Full Body');
            $equipment = trim($inputData['equipment'] ?? 'Barbell');
            $icon = trim($inputData['icon'] ?? 'dumbbell');
            $description = trim($inputData['description'] ?? '');

            if (empty($name)) {
                sendResponse('error', null, 'Exercise name is required', 400);
            }

            $stmt = $pdo->prepare("INSERT INTO `exercises` (`name`, `category`, `target_muscle`, `equipment`, `icon`, `description`) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $category, $target_muscle, $equipment, $icon, $description]);
            $newId = $pdo->lastInsertId();

            $created = $pdo->query("SELECT * FROM `exercises` WHERE `id` = {$newId}")->fetch();
            sendResponse('success', $created, 'Exercise module created', 201);
        } 
        elseif ($method === 'DELETE') {
            $id = (int)($_GET['id'] ?? ($inputData['id'] ?? 0));
            if ($id <= 0) {
                sendResponse('error', null, 'Valid exercise ID is required', 400);
            }
            $stmt = $pdo->prepare("DELETE FROM `exercises` WHERE `id` = ?");
            $stmt->execute([$id]);
            sendResponse('success', ['id' => $id], 'Exercise module deleted');
        }
        break;

    // -------------------------------------------------------------
    // WORKOUT LOGS
    // -------------------------------------------------------------
    case 'logs':
        if ($method === 'GET') {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $stmt = $pdo->prepare("SELECT l.*, e.category, e.target_muscle, e.icon 
                                   FROM `workout_logs` l 
                                   LEFT JOIN `exercises` e ON l.exercise_id = e.id 
                                   ORDER BY l.logged_at DESC 
                                   LIMIT :lim");
            $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $logs = $stmt->fetchAll();
            sendResponse('success', $logs, 'Workout logs retrieved');
        } 
        elseif ($method === 'POST') {
            $exercise_id = !empty($inputData['exercise_id']) ? (int)$inputData['exercise_id'] : null;
            $exercise_name = trim($inputData['exercise_name'] ?? '');
            $sets = max(1, (int)($inputData['sets'] ?? 1));
            $reps = max(1, (int)($inputData['reps'] ?? 10));
            $weight = max(0, (float)($inputData['weight'] ?? 0));
            $weight_unit = in_array(strtolower($inputData['weight_unit'] ?? 'kg'), ['kg', 'lbs']) ? strtolower($inputData['weight_unit']) : 'kg';
            $duration_minutes = max(0, (int)($inputData['duration_minutes'] ?? 0));
            $calories_burned = max(0, (int)($inputData['calories_burned'] ?? 0));
            $rpe = max(1, min(10, (int)($inputData['rpe'] ?? 8)));
            $notes = trim($inputData['notes'] ?? '');
            $logged_at = !empty($inputData['logged_at']) ? $inputData['logged_at'] : date('Y-m-d H:i:s');

            if (empty($exercise_name)) {
                sendResponse('error', null, 'Exercise name is required', 400);
            }

            $stmt = $pdo->prepare("INSERT INTO `workout_logs` 
                (`exercise_id`, `exercise_name`, `sets`, `reps`, `weight`, `weight_unit`, `duration_minutes`, `calories_burned`, `rpe`, `notes`, `logged_at`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $exercise_id, $exercise_name, $sets, $reps, $weight, $weight_unit,
                $duration_minutes, $calories_burned, $rpe, $notes, $logged_at
            ]);
            $newLogId = $pdo->lastInsertId();

            $newLog = $pdo->query("SELECT * FROM `workout_logs` WHERE `id` = {$newLogId}")->fetch();
            sendResponse('success', $newLog, 'Workout logged successfully', 201);
        } 
        elseif ($method === 'DELETE') {
            $id = (int)($_GET['id'] ?? ($inputData['id'] ?? 0));
            if ($id <= 0) {
                sendResponse('error', null, 'Valid workout log ID is required', 400);
            }
            $stmt = $pdo->prepare("DELETE FROM `workout_logs` WHERE `id` = ?");
            $stmt->execute([$id]);
            sendResponse('success', ['id' => $id], 'Workout log deleted successfully');
        }
        break;

    // -------------------------------------------------------------
    // DAILY ALARMS & PROTOCOL REMINDERS
    // Schema: id, exercise_name, duration_value, duration_unit, weeks_duration,
    //         is_today_only, target_date, reminder_time, days_of_week, is_active, created_at
    // -------------------------------------------------------------
    case 'reminders':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT `id`, `exercise_name`, `duration_value`, `duration_unit`, `weeks_duration`,
                                        `is_today_only`, `target_date`, `reminder_time`, `days_of_week`, `is_active`, `created_at`,
                                        `days_of_week` AS `days`, `exercise_name` AS `title`, `reminder_time` AS `time`
                                 FROM `reminders` 
                                 ORDER BY `reminder_time` ASC, `id` ASC");
            $reminders = $stmt ? $stmt->fetchAll() : [];
            if (!is_array($reminders)) {
                $reminders = [];
            }
            foreach ($reminders as &$r) {
                $r['duration_value'] = (int)($r['duration_value'] ?? 30);
                $r['weeks_duration'] = (int)($r['weeks_duration'] ?? 4);
                $r['is_today_only'] = (int)(bool)($r['is_today_only'] ?? 0);
                $r['is_active'] = (int)(bool)($r['is_active'] ?? 1);
            }
            unset($r);
            sendResponse('success', $reminders, 'Reminders retrieved');
        } 
        elseif ($method === 'POST') {
            $id = !empty($inputData['id']) ? (int)$inputData['id'] : null;
            $exercise_name = trim($inputData['exercise_name'] ?? ($inputData['title'] ?? 'Workout Protocol'));
            $duration_value = max(1, (int)($inputData['duration_value'] ?? 30));
            $duration_unit = in_array(strtolower($inputData['duration_unit'] ?? 'minutes'), ['seconds', 'minutes']) ? strtolower($inputData['duration_unit']) : 'minutes';
            $weeks_duration = max(1, (int)($inputData['weeks_duration'] ?? 4));
            $is_today_only = !empty($inputData['is_today_only']) ? 1 : 0;
            $target_date = !empty($inputData['target_date']) ? trim($inputData['target_date']) : ($is_today_only ? date('Y-m-d') : null);
            $reminder_time = trim($inputData['reminder_time'] ?? ($inputData['time'] ?? '08:00'));
            $days_of_week = is_array($inputData['days_of_week'] ?? null) 
                ? implode(',', $inputData['days_of_week']) 
                : trim($inputData['days_of_week'] ?? ($inputData['days'] ?? 'Mon,Wed,Fri'));
            $is_active = isset($inputData['is_active']) ? (int)(bool)$inputData['is_active'] : 1;

            if (empty($exercise_name)) {
                sendResponse('error', null, 'Exercise name is required', 400);
            }

            if ($id) {
                // Update existing reminder
                $stmt = $pdo->prepare("UPDATE `reminders` SET 
                    `exercise_name` = ?, 
                    `duration_value` = ?, 
                    `duration_unit` = ?, 
                    `weeks_duration` = ?, 
                    `is_today_only` = ?, 
                    `target_date` = ?, 
                    `reminder_time` = ?, 
                    `days_of_week` = ?, 
                    `is_active` = ? 
                    WHERE `id` = ?");
                $stmt->execute([
                    $exercise_name, $duration_value, $duration_unit, $weeks_duration,
                    $is_today_only, $target_date, $reminder_time, $days_of_week, $is_active, $id
                ]);
                $saved = $pdo->query("SELECT *, `days_of_week` AS `days`, `exercise_name` AS `title`, `reminder_time` AS `time` FROM `reminders` WHERE `id` = {$id}")->fetch();
                if ($saved) {
                    $saved['duration_value'] = (int)$saved['duration_value'];
                    $saved['weeks_duration'] = (int)$saved['weeks_duration'];
                    $saved['is_today_only'] = (int)(bool)$saved['is_today_only'];
                    $saved['is_active'] = (int)(bool)$saved['is_active'];
                }
                sendResponse('success', $saved, 'Reminder updated successfully');
            } else {
                // Insert new reminder
                $stmt = $pdo->prepare("INSERT INTO `reminders` 
                    (`exercise_name`, `duration_value`, `duration_unit`, `weeks_duration`, `is_today_only`, `target_date`, `reminder_time`, `days_of_week`, `is_active`) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $exercise_name, $duration_value, $duration_unit, $weeks_duration,
                    $is_today_only, $target_date, $reminder_time, $days_of_week, $is_active
                ]);
                $newId = $pdo->lastInsertId();
                $saved = $pdo->query("SELECT *, `days_of_week` AS `days`, `exercise_name` AS `title`, `reminder_time` AS `time` FROM `reminders` WHERE `id` = {$newId}")->fetch();
                if ($saved) {
                    $saved['duration_value'] = (int)$saved['duration_value'];
                    $saved['weeks_duration'] = (int)$saved['weeks_duration'];
                    $saved['is_today_only'] = (int)(bool)$saved['is_today_only'];
                    $saved['is_active'] = (int)(bool)$saved['is_active'];
                }
                sendResponse('success', $saved, 'Reminder created successfully', 201);
            }
        } 
        elseif ($method === 'DELETE') {
            $id = (int)($_GET['id'] ?? ($inputData['id'] ?? 0));
            if ($id <= 0) {
                sendResponse('error', null, 'Valid reminder ID is required', 400);
            }
            $stmt = $pdo->prepare("DELETE FROM `reminders` WHERE `id` = ?");
            $stmt->execute([$id]);
            sendResponse('success', ['id' => $id], 'Reminder deleted successfully');
        }
        break;

    // -------------------------------------------------------------
    // USER METRICS & BMI CALCULATOR
    // Schema: id, age, height_cm, weight_kg, bmi_value, bmi_status, updated_at
    // -------------------------------------------------------------
    case 'user_metrics':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM `user_metrics` ORDER BY `updated_at` DESC, `id` DESC LIMIT 1");
            $metric = $stmt ? $stmt->fetch() : null;
            if (!$metric) {
                $metric = [
                    'id' => null,
                    'age' => 25,
                    'height' => 175.00,
                    'weight' => 70.00,
                    'bmi' => 22.9,
                    'height_cm' => 175.00,
                    'weight_kg' => 70.00,
                    'bmi_value' => 22.9,
                    'bmi_status' => 'Normal',
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            } else {
                $metric['age'] = (int)($metric['age'] ?? 25);
                $metric['height_cm'] = (float)$metric['height_cm'];
                $metric['weight_kg'] = (float)$metric['weight_kg'];
                $metric['bmi_value'] = (float)$metric['bmi_value'];
                $metric['height'] = $metric['height_cm'];
                $metric['weight'] = $metric['weight_kg'];
                $metric['bmi'] = $metric['bmi_value'];
            }
            sendResponse('success', $metric, 'User metrics retrieved');
        } 
        elseif ($method === 'POST') {
            $age = max(10, min(120, (int)($inputData['age'] ?? 25)));
            $height_cm = max(40.0, min(300.0, (float)($inputData['height_cm'] ?? ($inputData['height'] ?? 175.0))));
            $weight_kg = max(20.0, min(500.0, (float)($inputData['weight_kg'] ?? ($inputData['weight'] ?? 70.0))));
            
            // Calculate BMI: weight (kg) / [height (m)]^2
            $height_m = $height_cm / 100.0;
            $calculatedBmi = round($weight_kg / ($height_m * $height_m), 1);
            $bmi_value = isset($inputData['bmi_value']) 
                ? round((float)$inputData['bmi_value'], 1) 
                : (isset($inputData['bmi']) ? round((float)$inputData['bmi'], 1) : $calculatedBmi);

            // Determine status
            if (!empty($inputData['bmi_status'])) {
                $bmi_status = trim($inputData['bmi_status']);
            } else {
                if ($bmi_value < 18.5) {
                    $bmi_status = 'Underweight';
                } elseif ($bmi_value < 25.0) {
                    $bmi_status = 'Normal';
                } elseif ($bmi_value < 30.0) {
                    $bmi_status = 'Overweight';
                } else {
                    $bmi_status = 'Obese';
                }
            }

            // Check if existing record exists
            $existing = $pdo->query("SELECT `id` FROM `user_metrics` ORDER BY `id` ASC LIMIT 1")->fetch();

            if ($existing) {
                $id = (int)$existing['id'];
                $stmt = $pdo->prepare("UPDATE `user_metrics` SET `age` = ?, `height_cm` = ?, `weight_kg` = ?, `bmi_value` = ?, `bmi_status` = ?, `updated_at` = NOW() WHERE `id` = ?");
                $stmt->execute([$age, $height_cm, $weight_kg, $bmi_value, $bmi_status, $id]);
                $saved = $pdo->query("SELECT * FROM `user_metrics` WHERE `id` = {$id}")->fetch();
            } else {
                $stmt = $pdo->prepare("INSERT INTO `user_metrics` (`age`, `height_cm`, `weight_kg`, `bmi_value`, `bmi_status`) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$age, $height_cm, $weight_kg, $bmi_value, $bmi_status]);
                $newId = $pdo->lastInsertId();
                $saved = $pdo->query("SELECT * FROM `user_metrics` WHERE `id` = {$newId}")->fetch();
            }

            if ($saved) {
                $saved['age'] = (int)($saved['age'] ?? $age);
                $saved['height_cm'] = (float)$saved['height_cm'];
                $saved['weight_kg'] = (float)$saved['weight_kg'];
                $saved['bmi_value'] = (float)$saved['bmi_value'];
                $saved['height'] = $saved['height_cm'];
                $saved['weight'] = $saved['weight_kg'];
                $saved['bmi'] = $saved['bmi_value'];
            }

            sendResponse('success', $saved, 'User metrics saved successfully', 200);
        }
        break;

    // -------------------------------------------------------------
    // USER PROFILE & BASIC APP SETTINGS
    // Schema: id, user_name, age, fitness_goal, preferred_unit, sound_enabled, sound_type, updated_at
    // -------------------------------------------------------------
    case 'profile':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM `user_profile` ORDER BY `updated_at` DESC, `id` DESC LIMIT 1");
            $profile = $stmt ? $stmt->fetch() : null;
            if (!$profile) {
                $profile = [
                    'id' => 1,
                    'user_name' => 'John Melrow',
                    'age' => 25,
                    'fitness_goal' => 'Muscle Gain',
                    'preferred_unit' => 'metric',
                    'sound_enabled' => 1,
                    'sound_type' => 'modern-chime',
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            } else {
                $profile['age'] = (int)($profile['age'] ?? 25);
                $profile['sound_enabled'] = (int)(bool)$profile['sound_enabled'];
            }
            sendResponse('success', $profile, 'User profile retrieved');
        } 
        elseif ($method === 'POST') {
            $user_name = trim($inputData['user_name'] ?? 'Athlete');
            $age = max(10, min(120, (int)($inputData['age'] ?? 25)));
            $fitness_goal = trim($inputData['fitness_goal'] ?? 'Muscle Gain');
            $preferred_unit = in_array(strtolower($inputData['preferred_unit'] ?? 'metric'), ['metric', 'imperial']) 
                ? strtolower($inputData['preferred_unit']) 
                : 'metric';
            $sound_enabled = isset($inputData['sound_enabled']) ? (int)(bool)$inputData['sound_enabled'] : 1;
            $sound_type = trim($inputData['sound_type'] ?? 'modern-chime');

            $existing = $pdo->query("SELECT `id` FROM `user_profile` ORDER BY `id` ASC LIMIT 1")->fetch();

            if ($existing) {
                $id = (int)$existing['id'];
                $stmt = $pdo->prepare("UPDATE `user_profile` SET 
                    `user_name` = ?, 
                    `age` = ?,
                    `fitness_goal` = ?, 
                    `preferred_unit` = ?, 
                    `sound_enabled` = ?, 
                    `sound_type` = ?, 
                    `updated_at` = NOW() 
                    WHERE `id` = ?");
                $stmt->execute([$user_name, $age, $fitness_goal, $preferred_unit, $sound_enabled, $sound_type, $id]);
                $saved = $pdo->query("SELECT * FROM `user_profile` WHERE `id` = {$id}")->fetch();
            } else {
                $stmt = $pdo->prepare("INSERT INTO `user_profile` 
                    (`user_name`, `age`, `fitness_goal`, `preferred_unit`, `sound_enabled`, `sound_type`) 
                    VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user_name, $age, $fitness_goal, $preferred_unit, $sound_enabled, $sound_type]);
                $newId = $pdo->lastInsertId();
                $saved = $pdo->query("SELECT * FROM `user_profile` WHERE `id` = {$newId}")->fetch();
            }

            if ($saved) {
                $saved['age'] = (int)($saved['age'] ?? $age);
                $saved['sound_enabled'] = (int)(bool)$saved['sound_enabled'];
            }

            sendResponse('success', $saved, 'User profile saved successfully', 200);
        }
        break;

    // -------------------------------------------------------------
    // BATCH SYNC / RESTORE
    // -------------------------------------------------------------
    case 'sync':
        if ($method === 'POST') {
            $pdo->beginTransaction();
            try {
                $logs = $inputData['logs'] ?? [];
                $syncedCount = 0;
                $stmt = $pdo->prepare("INSERT INTO `workout_logs` 
                    (`exercise_id`, `exercise_name`, `sets`, `reps`, `weight`, `weight_unit`, `duration_minutes`, `calories_burned`, `rpe`, `notes`, `logged_at`) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

                foreach ($logs as $log) {
                    if (empty($log['exercise_name'])) continue;
                    $stmt->execute([
                        !empty($log['exercise_id']) ? (int)$log['exercise_id'] : null,
                        $log['exercise_name'],
                        max(1, (int)($log['sets'] ?? 1)),
                        max(1, (int)($log['reps'] ?? 10)),
                        max(0, (float)($log['weight'] ?? 0)),
                        $log['weight_unit'] ?? 'kg',
                        max(0, (int)($log['duration_minutes'] ?? 0)),
                        max(0, (int)($log['calories_burned'] ?? 0)),
                        max(1, min(10, (int)($log['rpe'] ?? 8))),
                        $log['notes'] ?? '',
                        $log['logged_at'] ?? date('Y-m-d H:i:s')
                    ]);
                    $syncedCount++;
                }

                $pdo->commit();
                sendResponse('success', ['synced_logs' => $syncedCount], "Successfully synced {$syncedCount} logs to MySQL");
            } catch (Exception $e) {
                $pdo->rollBack();
                sendResponse('error', null, 'Sync failed: ' . $e->getMessage(), 500);
            }
        }
        break;

    default:
        sendResponse('error', null, "Unknown action: {$action}", 404);
        break;
}
