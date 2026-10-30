/**
 * DailyGains Cybertech API Service
 * Connects React frontend to PHP XAMPP MySQL backend (api.php)
 * Includes intelligent LocalStorage offline caching and fallback
 */

const DEFAULT_API_URL = 'http://localhost/dailygains/api.php';
const STORAGE_KEYS = {
  API_URL: 'dailygains_api_url',
  LOCAL_LOGS: 'dailygains_local_logs',
  LOCAL_EXERCISES: 'dailygains_local_exercises',
  LOCAL_REMINDERS: 'dailygains_local_reminders',
  OFFLINE_MODE: 'dailygains_force_offline'
};

// Cyber starter exercises
export const DEFAULT_EXERCISES = [
  { id: 1, name: 'Quantum Bench Press', category: 'Strength', target_muscle: 'Chest', equipment: 'Barbell', icon: 'dumbbell', description: 'Heavy kinetic chest pressing for pectoral fiber synthesis.' },
  { id: 2, name: 'Cyber Deadlift', category: 'Powerlifting', target_muscle: 'Back', equipment: 'Barbell', icon: 'zap', description: 'Posterior chain recruitment and spinal stabilizer overload.' },
  { id: 3, name: 'Overclock Squats', category: 'Strength', target_muscle: 'Legs', equipment: 'Barbell', icon: 'activity', description: 'High-voltage quadricep and glute hypertrophy activation.' },
  { id: 4, name: 'Neural Lat Pulldowns', category: 'Hypertrophy', target_muscle: 'Back', equipment: 'Cable', icon: 'trending-up', description: 'Targeted lats latissimus dorsi mechanical contraction.' },
  { id: 5, name: 'Bionic Bicep Curls', category: 'Isolation', target_muscle: 'Arms', equipment: 'Dumbbell', icon: 'shield', description: 'Peak bicep tension with alternating rotation lock.' },
  { id: 6, name: 'Tricep Plasma Pushdowns', category: 'Isolation', target_muscle: 'Arms', equipment: 'Cable', icon: 'zap', description: 'Lockout tricep horseshoe development.' },
  { id: 7, name: 'Plasma Shoulder Press', category: 'Hypertrophy', target_muscle: 'Shoulders', equipment: 'Dumbbell', icon: 'dumbbell', description: 'Deltoid kinetic press for cyber-silhouette width.' },
  { id: 8, name: 'Core Overdrive Planks', category: 'Endurance', target_muscle: 'Core', equipment: 'Bodyweight', icon: 'shield', description: 'Isometric abdominal wall stabilizer endurance test.' },
  { id: 9, name: 'Hyperdrive HIIT Sprints', category: 'Cardio', target_muscle: 'Cardio', equipment: 'Treadmill', icon: 'flame', description: 'Maximum VO2 surge protocol for mitochondrial acceleration.' },
  { id: 10, name: 'Titan Leg Press', category: 'Hypertrophy', target_muscle: 'Legs', equipment: 'Machine', icon: 'activity', description: 'High-load closed kinetic chain leg press.' }
];

// Cyber starter reminders
export const DEFAULT_REMINDERS = [
  { id: 1, title: 'Morning Hypertrophy Protocol', time: '06:30', days: 'Mon,Tue,Wed,Thu,Fri', sound: 'cyber-siren', is_active: 1 },
  { id: 2, title: 'Post-Work Neural Overdrive', time: '18:00', days: 'Mon,Wed,Fri', sound: 'pulse-alarm', is_active: 1 }
];

// Cyber starter logs for instant rich analytics display
const getInitialLogs = () => {
  const now = new Date();
  const d = (daysAgo, hours = 9) => {
    const target = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    target.setHours(hours, 30, 0, 0);
    return target.toISOString().slice(0, 19).replace('T', ' ');
  };

  return [
    { id: 101, exercise_id: 1, exercise_name: 'Quantum Bench Press', sets: 4, reps: 8, weight: 102.5, weight_unit: 'kg', duration_minutes: 32, calories_burned: 280, rpe: 9, notes: 'Hit personal record on set 3.', logged_at: d(0, 8), category: 'Strength', target_muscle: 'Chest' },
    { id: 102, exercise_id: 5, exercise_name: 'Bionic Bicep Curls', sets: 3, reps: 12, weight: 22.0, weight_unit: 'kg', duration_minutes: 20, calories_burned: 140, rpe: 8, notes: 'Peak pump lock.', logged_at: d(0, 9), category: 'Isolation', target_muscle: 'Arms' },
    { id: 103, exercise_id: 3, exercise_name: 'Overclock Squats', sets: 5, reps: 5, weight: 145.0, weight_unit: 'kg', duration_minutes: 45, calories_burned: 420, rpe: 9, notes: 'Explosive ascent drive.', logged_at: d(1, 17), category: 'Strength', target_muscle: 'Legs' },
    { id: 104, exercise_id: 8, exercise_name: 'Core Overdrive Planks', sets: 3, reps: 60, weight: 0.0, weight_unit: 'kg', duration_minutes: 15, calories_burned: 110, rpe: 7, notes: 'Solid tension held.', logged_at: d(1, 18), category: 'Endurance', target_muscle: 'Core' },
    { id: 105, exercise_id: 2, exercise_name: 'Cyber Deadlift', sets: 4, reps: 6, weight: 165.0, weight_unit: 'kg', duration_minutes: 40, calories_burned: 390, rpe: 9, notes: 'Grip locked, fluid speed.', logged_at: d(2, 10), category: 'Powerlifting', target_muscle: 'Back' },
    { id: 106, exercise_id: 4, exercise_name: 'Neural Lat Pulldowns', sets: 4, reps: 10, weight: 75.0, weight_unit: 'kg', duration_minutes: 25, calories_burned: 190, rpe: 8, notes: 'Full lat stretch.', logged_at: d(2, 11), category: 'Hypertrophy', target_muscle: 'Back' },
    { id: 107, exercise_id: 7, exercise_name: 'Plasma Shoulder Press', sets: 4, reps: 10, weight: 28.0, weight_unit: 'kg', duration_minutes: 28, calories_burned: 220, rpe: 8, notes: 'Clean overhead lockouts.', logged_at: d(3, 16), category: 'Hypertrophy', target_muscle: 'Shoulders' },
    { id: 108, exercise_id: 9, exercise_name: 'Hyperdrive HIIT Sprints', sets: 8, reps: 1, weight: 0.0, weight_unit: 'kg', duration_minutes: 20, calories_burned: 310, rpe: 10, notes: 'Heart rate spiked to 184 BPM.', logged_at: d(4, 7), category: 'Cardio', target_muscle: 'Cardio' },
    { id: 109, exercise_id: 10, exercise_name: 'Titan Leg Press', sets: 4, reps: 12, weight: 280.0, weight_unit: 'kg', duration_minutes: 35, calories_burned: 340, rpe: 8, notes: 'Deep concentric contraction.', logged_at: d(5, 15), category: 'Hypertrophy', target_muscle: 'Legs' }
  ];
};

class ApiService {
  constructor() {
    this.apiUrl = localStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
    this.isOnline = null;
    this.initLocalData();
  }

  getApiUrl() {
    return this.apiUrl;
  }

  setApiUrl(url) {
    this.apiUrl = url.trim();
    localStorage.setItem(STORAGE_KEYS.API_URL, this.apiUrl);
  }

  initLocalData() {
    if (!localStorage.getItem(STORAGE_KEYS.LOCAL_EXERCISES)) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_EXERCISES, JSON.stringify(DEFAULT_EXERCISES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCAL_REMINDERS)) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_REMINDERS, JSON.stringify(DEFAULT_REMINDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCAL_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(getInitialLogs()));
    }
  }

  // Check connection status with timeout
  async checkConnection(customUrl = null) {
    const url = (customUrl || this.apiUrl).replace(/\/$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${url}?action=status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      this.isOnline = json.status === 'success';
      return {
        online: this.isOnline,
        data: json.data || null,
        message: json.message || 'Connected'
      };
    } catch (err) {
      this.isOnline = false;
      return {
        online: false,
        data: null,
        message: err.name === 'AbortError' ? 'Connection timed out' : err.message
      };
    }
  }

  // -----------------------------------------------------------------
  // EXERCISES API
  // -----------------------------------------------------------------
  async getExercises() {
    try {
      const res = await fetch(`${this.apiUrl}?action=exercises`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_EXERCISES, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }
    const local = localStorage.getItem(STORAGE_KEYS.LOCAL_EXERCISES);
    return local ? JSON.parse(local) : DEFAULT_EXERCISES;
  }

  async createExercise(exerciseData) {
    let savedExercise = null;
    try {
      const res = await fetch(`${this.apiUrl}?action=exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          savedExercise = json.data;
        }
      }
    } catch {
      // Offline fallback
    }

    if (!savedExercise) {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_EXERCISES) || '[]');
      savedExercise = {
        id: Date.now(),
        ...exerciseData,
        created_at: new Date().toISOString()
      };
      current.push(savedExercise);
      localStorage.setItem(STORAGE_KEYS.LOCAL_EXERCISES, JSON.stringify(current));
    }
    return savedExercise;
  }

  async deleteExercise(id) {
    try {
      await fetch(`${this.apiUrl}?action=exercises&id=${id}`, { method: 'DELETE' });
    } catch {
      // Ignore
    }
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_EXERCISES) || '[]');
    const filtered = current.filter(ex => Number(ex.id) !== Number(id));
    localStorage.setItem(STORAGE_KEYS.LOCAL_EXERCISES, JSON.stringify(filtered));
    return true;
  }

  // -----------------------------------------------------------------
  // WORKOUT LOGS API
  // -----------------------------------------------------------------
  async getWorkoutLogs(limit = 100) {
    try {
      const res = await fetch(`${this.apiUrl}?action=logs&limit=${limit}`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          // If remote returned records, update local cache
          if (json.data.length > 0) {
            localStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(json.data));
            return json.data;
          }
        }
      }
    } catch {
      // Offline fallback
    }

    const local = localStorage.getItem(STORAGE_KEYS.LOCAL_LOGS);
    return local ? JSON.parse(local) : [];
  }

  async createWorkoutLog(logData) {
    let newLog = null;
    try {
      const res = await fetch(`${this.apiUrl}?action=logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          newLog = json.data;
        }
      }
    } catch {
      // Remote failed, proceed to local
    }

    if (!newLog) {
      newLog = {
        id: Date.now(),
        ...logData,
        created_at: new Date().toISOString()
      };
    }

    // Always update local cache for instant UI response
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_LOGS) || '[]');
    const updated = [newLog, ...current];
    localStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(updated));

    return newLog;
  }

  async deleteWorkoutLog(id) {
    try {
      await fetch(`${this.apiUrl}?action=logs&id=${id}`, { method: 'DELETE' });
    } catch {
      // Offline fallback
    }

    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_LOGS) || '[]');
    const filtered = current.filter(l => Number(l.id) !== Number(id));
    localStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(filtered));
    return true;
  }

  // -----------------------------------------------------------------
  // DAILY ALARMS & REMINDERS API
  // -----------------------------------------------------------------
  async getReminders() {
    try {
      const res = await fetch(`${this.apiUrl}?action=reminders`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_REMINDERS, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {
      // Offline
    }

    const local = localStorage.getItem(STORAGE_KEYS.LOCAL_REMINDERS);
    return local ? JSON.parse(local) : DEFAULT_REMINDERS;
  }

  async saveReminder(reminderData) {
    let saved = null;
    try {
      const res = await fetch(`${this.apiUrl}?action=reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          saved = json.data;
        }
      }
    } catch {
      // Offline
    }

    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_REMINDERS) || '[]');
    if (saved) {
      const existingIdx = current.findIndex(r => Number(r.id) === Number(saved.id));
      if (existingIdx >= 0) {
        current[existingIdx] = saved;
      } else {
        current.push(saved);
      }
    } else {
      if (reminderData.id) {
        const idx = current.findIndex(r => Number(r.id) === Number(reminderData.id));
        if (idx >= 0) {
          current[idx] = { ...current[idx], ...reminderData };
          saved = current[idx];
        }
      } else {
        saved = {
          id: Date.now(),
          ...reminderData,
          created_at: new Date().toISOString()
        };
        current.push(saved);
      }
    }

    localStorage.setItem(STORAGE_KEYS.LOCAL_REMINDERS, JSON.stringify(current));
    return saved;
  }

  async deleteReminder(id) {
    try {
      await fetch(`${this.apiUrl}?action=reminders&id=${id}`, { method: 'DELETE' });
    } catch {
      // Offline
    }

    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_REMINDERS) || '[]');
    const filtered = current.filter(r => Number(r.id) !== Number(id));
    localStorage.setItem(STORAGE_KEYS.LOCAL_REMINDERS, JSON.stringify(filtered));
    return true;
  }

  // -----------------------------------------------------------------
  // SYNC LOCAL LOGS TO MYSQL DATABASE
  // -----------------------------------------------------------------
  async syncLocalLogsToDatabase() {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_LOGS) || '[]');
    if (logs.length === 0) {
      return { success: true, count: 0, message: 'No local logs to sync' };
    }

    try {
      const res = await fetch(`${this.apiUrl}?action=sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        return { success: true, count: json.data?.synced_logs || logs.length, message: json.message };
      }
      throw new Error(json.message || 'Sync failed');
    } catch (err) {
      return { success: false, count: 0, message: err.message };
    }
  }
}

export const api = new ApiService();
