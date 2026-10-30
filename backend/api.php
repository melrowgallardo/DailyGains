<?php
/**
 * DailyGains Cybertech Gym Workout Monitoring API
 * Backend REST API for PHP + XAMPP MySQL
 * 
 * Supports: GET, POST, DELETE, OPTIONS
 * Default DB: dailygains (Auto-created if absent)
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
    // Exercises table
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

    // Workout logs table
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

    // Reminders table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `reminders` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(100) NOT NULL DEFAULT 'Cyber Protocol Activation',
        `time` VARCHAR(10) NOT NULL DEFAULT '07:00',
        `days` VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
        `sound` VARCHAR(50) NOT NULL DEFAULT 'cyber-siren',
        `is_active` TINYINT(1) NOT NULL DEFAULT 1,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Seed default cyber exercises if empty
    $chk = $pdo->query("SELECT COUNT(*) as cnt FROM `exercises`")->fetch();
    if ($chk && (int)$chk['cnt'] === 0) {
        $seedStmt = $pdo->prepare("INSERT INTO `exercises` (`name`, `category`, `target_muscle`, `equipment`, `icon`, `description`) VALUES (?, ?, ?, ?, ?, ?)");
        $seeds = [
            ['Quantum Bench Press', 'Strength', 'Chest', 'Barbell', 'dumbbell', 'Heavy kinetic chest pressing for pectoral fiber synthesis.'],
            ['Cyber Deadlift', 'Powerlifting', 'Back', 'Barbell', 'zap', 'Posterior chain recruitment and spinal stabilizer overload.'],
            ['Overclock Squats', 'Strength', 'Legs', 'Barbell', 'activity', 'High-voltage quadricep and glute hypertrophy activation.'],
            ['Neural Lat Pulldowns', 'Hypertrophy', 'Back', 'Cable', 'trending-up', 'Targeted lats latissimus dorsi mechanical contraction.'],
            ['Bionic Bicep Curls', 'Isolation', 'Arms', 'Dumbbell', 'shield', 'Peak bicep tension with alternating rotation lock.'],
            ['Tricep Plasma Pushdowns', 'Isolation', 'Arms', 'Cable', 'zap', 'Lockout tricep horseshoe development.'],
            ['Plasma Shoulder Press', 'Hypertrophy', 'Shoulders', 'Dumbbell', 'dumbbell', 'Deltoid kinetic press for cyber-silhouette width.'],
            ['Core Overdrive Planks', 'Endurance', 'Core', 'Bodyweight', 'shield', 'Isometric abdominal wall stabilizer endurance test.'],
            ['Hyperdrive HIIT Sprints', 'Cardio', 'Cardio', 'Treadmill', 'flame', 'Maximum VO2 surge protocol for mitochondrial acceleration.'],
            ['Titan Leg Press', 'Hypertrophy', 'Legs', 'Machine', 'activity', 'High-load closed kinetic chain leg press.']
        ];
        foreach ($seeds as $s) {
            $seedStmt->execute($s);
        }
    }

    // Seed default reminder if empty
    $chkRem = $pdo->query("SELECT COUNT(*) as cnt FROM `reminders`")->fetch();
    if ($chkRem && (int)$chkRem['cnt'] === 0) {
        $pdo->exec("INSERT INTO `reminders` (`title`, `time`, `days`, `sound`, `is_active`) VALUES ('Morning Hypertrophy Protocol', '06:30', 'Mon,Tue,Wed,Thu,Fri', 'cyber-siren', 1)");
    }
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

            sendResponse('success', [
                'api' => 'DailyGains Cybertech REST API',
                'version' => '2.0.0',
                'connected' => true,
                'database' => $dbName,
                'php_version' => PHP_VERSION,
                'server_time' => date('Y-m-d H:i:s'),
                'counts' => [
                    'exercises' => (int)$exCount,
                    'logs' => (int)$logCount,
                    'reminders' => (int)$remCount
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
            $exercises = $stmt->fetchAll();
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
    // -------------------------------------------------------------
    case 'reminders':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM `reminders` ORDER BY `time` ASC");
            $reminders = $stmt->fetchAll();
            sendResponse('success', $reminders, 'Reminders retrieved');
        } 
        elseif ($method === 'POST') {
            $id = !empty($inputData['id']) ? (int)$inputData['id'] : null;
            $title = trim($inputData['title'] ?? 'Cyber Protocol Activation');
            $time = trim($inputData['time'] ?? '07:00');
            $days = is_array($inputData['days'] ?? null) ? implode(',', $inputData['days']) : trim($inputData['days'] ?? 'Mon,Tue,Wed,Thu,Fri');
            $sound = trim($inputData['sound'] ?? 'cyber-siren');
            $is_active = isset($inputData['is_active']) ? (int)(bool)$inputData['is_active'] : 1;

            if ($id) {
                // Update existing reminder
                $stmt = $pdo->prepare("UPDATE `reminders` SET `title` = ?, `time` = ?, `days` = ?, `sound` = ?, `is_active` = ? WHERE `id` = ?");
                $stmt->execute([$title, $time, $days, $sound, $is_active, $id]);
                $saved = $pdo->query("SELECT * FROM `reminders` WHERE `id` = {$id}")->fetch();
                sendResponse('success', $saved, 'Reminder updated');
            } else {
                // Insert new reminder
                $stmt = $pdo->prepare("INSERT INTO `reminders` (`title`, `time`, `days`, `sound`, `is_active`) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$title, $time, $days, $sound, $is_active]);
                $newId = $pdo->lastInsertId();
                $saved = $pdo->query("SELECT * FROM `reminders` WHERE `id` = {$newId}")->fetch();
                sendResponse('success', $saved, 'Reminder created', 201);
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
