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
  const [userMetrics, setUserMetrics] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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

    // 2. Load exercises, logs, reminders, user metrics, and profile
    const [fetchedExercises, fetchedLogs, fetchedReminders, fetchedMetrics, fetchedProfile] = await Promise.all([
      api.getExercises(),
      api.getWorkoutLogs(150),
      api.getReminders(),
      api.getUserMetrics(),
      api.getUserProfile()
    ]);

    setExercises(fetchedExercises);
    setLogs(fetchedLogs);
    setReminders(fetchedReminders);
    setUserMetrics(fetchedMetrics);
    setUserProfile(fetchedProfile);

    if (fetchedProfile && fetchedProfile.sound_enabled !== undefined) {
      const isMuted = Number(fetchedProfile.sound_enabled) === 0;
      setSoundMuted(isMuted);
      audio.setMuted(isMuted);
    }
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

  // Handlers for User Metrics
  const handleSaveUserMetrics = async (metricsData) => {
    const saved = await api.saveUserMetrics(metricsData);
    if (saved) {
      setUserMetrics(saved);
    }
    return saved;
  };

  // Handlers for User Profile
  const handleSaveUserProfile = async (profileData) => {
    const saved = await api.saveUserProfile(profileData);
    if (saved) {
      setUserProfile(saved);
    }
    return saved;
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
            reminders={reminders}
            saveReminder={handleSaveReminder}
            deleteReminder={handleDeleteReminder}
            userMetrics={userMetrics}
            saveUserMetrics={handleSaveUserMetrics}
            userProfile={userProfile}
            saveUserProfile={handleSaveUserProfile}
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
            theme={theme}
            setTheme={setTheme}
            toggleTheme={toggleTheme}
            soundMuted={soundMuted}
            setSoundMuted={setSoundMuted}
            refreshAllData={loadInitialData}
            userProfile={userProfile}
            onProfileUpdated={(updated) => {
              setUserProfile(updated);
            }}
          />
        )}
      </main>

      {/* Minimalist Modern Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        padding: '18px 0',
        backdropFilter: 'blur(8px)'
      }}>
        <div className="container-hud" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: 0,
          paddingBottom: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              Daily<span style={{ color: 'var(--accent-cyan)' }}>Gains</span>
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              • Modern Fitness Tracker & Routine Manager
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Status: {isOnline ? 'Connected to MySQL Database' : 'Local Storage Mode'}
          </div>
        </div>
      </footer>
    </div>
  );
}
