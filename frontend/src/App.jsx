import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WorkoutTracker from './components/WorkoutTracker';
import AlarmsReminders from './components/AlarmsReminders';
import GainsAnalytics from './components/GainsAnalytics';
import Settings from './components/Settings';
import { api } from './services/apiService';
import { audio } from './services/audioService';

export default function App() {
  // Navigation & Theme State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('dailygains_theme') || 'dark');
  const [soundMuted, setSoundMuted] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Biometric state
  const [bpm, setBpm] = useState(128);

  // App Data State
  const [logs, setLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalExercise, setModalExercise] = useState(null);

  // Apply Theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dailygains_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Initial Data Load & Connection Test
  const loadInitialData = async () => {
    setLoading(true);
    // 1. Test backend MySQL connection
    const statusResult = await api.checkConnection();
    setIsOnline(statusResult.online);

    // 2. Load exercises, logs, and reminders
    const [fetchedExercises, fetchedLogs, fetchedReminders] = await Promise.all([
      api.getExercises(),
      api.getWorkoutLogs(150),
      api.getReminders()
    ]);

    setExercises(fetchedExercises);
    setLogs(fetchedLogs);
    setReminders(fetchedReminders);
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handlers for Workout Logs
  const handleCreateLog = async (logData) => {
    const created = await api.createWorkoutLog(logData);
    if (created) {
      setLogs(prev => [created, ...prev]);
    }
  };

  const handleDeleteLog = async (id) => {
    await api.deleteWorkoutLog(id);
    setLogs(prev => prev.filter(l => Number(l.id) !== Number(id)));
  };

  // Handlers for Exercises
  const handleCreateExercise = async (exData) => {
    const created = await api.createExercise(exData);
    if (created) {
      setExercises(prev => [...prev, created]);
    }
    return created;
  };

  const handleDeleteExercise = async (id) => {
    await api.deleteExercise(id);
    setExercises(prev => prev.filter(e => Number(e.id) !== Number(id)));
  };

  // Handlers for Reminders
  const handleSaveReminder = async (remData) => {
    const saved = await api.saveReminder(remData);
    if (saved) {
      setReminders(prev => {
        const idx = prev.findIndex(r => Number(r.id) === Number(saved.id));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
    }
    return saved;
  };

  const handleDeleteReminder = async (id) => {
    await api.deleteReminder(id);
    setReminders(prev => prev.filter(r => Number(r.id) !== Number(id)));
  };

  // Modal controls
  const openLogModal = (exercise = null) => {
    setModalExercise(exercise);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setModalExercise(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Cybertech Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        isOnline={isOnline}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
        openQuickLog={() => openLogModal()}
      />

      {/* Main View Container */}
      <main className="container-hud" style={{ flexGrow: 1, paddingTop: '24px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            logs={logs}
            exercises={exercises}
            openLogModal={openLogModal}
            setActiveTab={setActiveTab}
            deleteLog={handleDeleteLog}
            bpm={bpm}
            setBpm={setBpm}
          />
        )}

        {activeTab === 'tracker' && (
          <WorkoutTracker
            logs={logs}
            exercises={exercises}
            createLog={handleCreateLog}
            deleteLog={handleDeleteLog}
            createExercise={handleCreateExercise}
            deleteExercise={handleDeleteExercise}
            isModalOpen={isLogModalOpen}
            openLogModal={openLogModal}
            closeLogModal={closeLogModal}
            initialExercise={modalExercise}
          />
        )}

        {activeTab === 'alarms' && (
          <AlarmsReminders
            reminders={reminders}
            saveReminder={handleSaveReminder}
            deleteReminder={handleDeleteReminder}
          />
        )}

        {activeTab === 'analytics' && (
          <GainsAnalytics
            logs={logs}
            exercises={exercises}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            refreshAllData={loadInitialData}
            logs={logs}
            exercises={exercises}
            reminders={reminders}
          />
        )}
      </main>

      {/* Futuristic Cyber Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        padding: '24px 0',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="container-hud" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingTop: 0,
          paddingBottom: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--cyber-cyan)'
            }}>
              <img src="/logo.jpg" alt="DailyGains" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <span className="font-display" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--cyber-cyan)' }}>
                DAILYGAINS // CYBERTECH HUD
              </span>
              <span className="font-tech" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                BIOMETRIC WORKOUT MONITORING SYSTEM
              </span>
            </div>
          </div>

          <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            STATUS: {isOnline ? 'MYSQL CONNECTED [PORT 80/3306]' : 'LOCAL REPOSITORY MODE'} • REST API V2.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}
