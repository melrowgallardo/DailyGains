import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Target, 
  Scale, 
  Save, 
  Check, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Bell, 
  Sun, 
  Moon, 
  Trash2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Sliders,
  Play
} from './icons';
import { api, DEFAULT_PROFILE } from '../services/apiService';
import { audio } from '../services/audioService';

export default function Settings({ 
  theme = 'dark',
  setTheme,
  toggleTheme,
  soundMuted = false,
  setSoundMuted,
  refreshAllData,
  userProfile: propProfile,
  onProfileUpdated
}) {
  // Profile Configuration State
  const [userName, setUserName] = useState('John Melrow');
  const [fitnessGoal, setFitnessGoal] = useState('Muscle Gain');
  const [preferredUnit, setPreferredUnit] = useState('metric');

  // App Preferences State
  const [soundEnabled, setSoundEnabled] = useState(!soundMuted);
  const [soundType, setSoundType] = useState('modern-chime');

  // UI Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewingSound, setPreviewingSound] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  // Load profile data on mount or when prop changes
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      const profile = propProfile || await api.getUserProfile();
      if (profile && isMounted) {
        setUserName(profile.user_name || 'John Melrow');
        setFitnessGoal(profile.fitness_goal || 'Muscle Gain');
        setPreferredUnit(profile.preferred_unit || 'metric');
        const isSndOn = profile.sound_enabled !== undefined ? Boolean(Number(profile.sound_enabled)) : !soundMuted;
        setSoundEnabled(isSndOn);
        setSoundType(profile.sound_type || 'modern-chime');
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [propProfile, soundMuted]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    audio.playClick();
    setIsSaving(true);

    const payload = {
      id: 1,
      user_name: userName.trim() || 'Athlete',
      fitness_goal: fitnessGoal,
      preferred_unit: preferredUnit,
      sound_enabled: soundEnabled ? 1 : 0,
      sound_type: soundType
    };

    const saved = await api.saveUserProfile(payload);
    setIsSaving(false);

    if (saved) {
      audio.playSuccess();
      setSaveSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(saved);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Toggle Sound Enabled
  const handleToggleSound = (enabled) => {
    setSoundEnabled(enabled);
    audio.setMuted(!enabled);
    if (setSoundMuted) {
      setSoundMuted(!enabled);
    }
    if (enabled) {
      audio.playClick();
    }
  };

  // Preview notification audio sound
  const handlePreviewSound = () => {
    setPreviewingSound(true);
    audio.setMuted(false);
    audio.playAlarm(soundType);
    setTimeout(() => {
      setPreviewingSound(false);
      audio.setMuted(!soundEnabled);
    }, 1200);
  };

  // Handle Switch Theme
  const handleSelectTheme = (mode) => {
    audio.playClick();
    if (setTheme) {
      setTheme(mode);
    } else if (toggleTheme && theme !== mode) {
      toggleTheme();
    }
  };

  // Confirm Reset App Data
  const handleConfirmReset = () => {
    audio.playClick();
    api.resetAllData();
    setShowResetModal(false);
    setResetMessage('App data has been reset to defaults.');

    if (refreshAllData) {
      refreshAllData();
    }

    // Reset local component states
    setUserName(DEFAULT_PROFILE.user_name);
    setFitnessGoal(DEFAULT_PROFILE.fitness_goal);
    setPreferredUnit(DEFAULT_PROFILE.preferred_unit);
    setSoundEnabled(Boolean(DEFAULT_PROFILE.sound_enabled));
    setSoundType(DEFAULT_PROFILE.sound_type);
    audio.setMuted(false);
    if (setSoundMuted) {
      setSoundMuted(false);
    }

    setTimeout(() => {
      setResetMessage(null);
    }, 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px', margin: '0 auto', paddingBottom: '32px' }}>
      
      {/* 1. Header & Overview */}
      <div className="cyber-panel" style={{
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '8px',
              background: 'var(--accent-cyan-light)',
              color: 'var(--accent-cyan)'
            }}>
              <SettingsIcon size={20} />
            </span>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em'
            }}>
              Settings & Preferences
            </h1>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}>
            Customize your athlete profile, fitness targets, audio alerts, and application appearance.
          </p>
        </div>

        {/* Global Save Indicator Banner */}
        {saveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.85rem',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease'
          }}>
            <CheckCircle size={16} />
            <span>Profile settings saved!</span>
          </div>
        )}

        {resetMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent-blue)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <CheckCircle size={16} />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>

      {/* 2. User Profile Configuration Card */}
      <div className="cyber-panel" style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingBottom: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <span style={{
            display: 'inline-flex',
            padding: '6px',
            borderRadius: '8px',
            background: 'var(--accent-blue-light)',
            color: 'var(--accent-blue)'
          }}>
            <User size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Profile Configuration
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Set your personal identity and workout training objectives.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Full Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Full Name / Athlete Handle
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. John Melrow"
                  className="cyber-input"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.92rem'
                  }}
                  required
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Displayed on your dashboard greeting and workout log exports.
              </span>
            </div>

            {/* Fitness Goal Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Primary Fitness Goal
              </label>
              <select
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="cyber-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.92rem',
                  cursor: 'pointer'
                }}
              >
                <option value="Muscle Gain">Muscle Gain (Hypertrophy)</option>
                <option value="Weight Loss">Weight Loss & Fat Burn</option>
                <option value="Endurance / Cardio">Endurance & Cardiovascular Conditioning</option>
                <option value="Strength & Powerlifting">Strength & Powerlifting</option>
                <option value="Maintenance">Maintenance & General Health</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Tailors routine reminders and performance metric targets.
              </span>
            </div>
          </div>

          {/* Preferred Units Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Preferred Measurement Units
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setPreferredUnit('metric');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1px solid ${preferredUnit === 'metric' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  background: preferredUnit === 'metric' ? 'var(--accent-cyan-light)' : 'var(--bg-card-subtle)',
                  color: preferredUnit === 'metric' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Scale size={16} />
                <span>Metric (Kilograms / Centimeters)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setPreferredUnit('imperial');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1px solid ${preferredUnit === 'imperial' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  background: preferredUnit === 'imperial' ? 'var(--accent-cyan-light)' : 'var(--bg-card-subtle)',
                  color: preferredUnit === 'imperial' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Scale size={16} />
                <span>Imperial (Pounds / Feet & Inches)</span>
              </button>
            </div>
          </div>

          {/* Save Profile Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={isSaving}
              className="cyber-btn cyber-btn-cyan"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {isSaving ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. App Preferences Card */}
      <div className="cyber-panel" style={{ padding: '24px 28px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingBottom: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <span style={{
            display: 'inline-flex',
            padding: '6px',
            borderRadius: '8px',
            background: 'var(--accent-cyan-light)',
            color: 'var(--accent-cyan)'
          }}>
            <Sliders size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              App Preferences
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Control sound effects, audio alerts, and interface theme.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Audio Alerts Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: soundEnabled ? 'var(--accent-cyan-light)' : 'rgba(148, 163, 184, 0.1)',
                color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)'
              }}>
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  Sound Effects & Audio Alerts
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Synthesized audio cues for workout timers, interval beeps, and button actions.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleToggleSound(true)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${soundEnabled ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  background: soundEnabled ? 'var(--accent-cyan-light)' : 'transparent',
                  color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Enabled
              </button>
              <button
                type="button"
                onClick={() => handleToggleSound(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${!soundEnabled ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                  background: !soundEnabled ? 'rgba(255, 100, 0, 0.12)' : 'transparent',
                  color: !soundEnabled ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Muted
              </button>
            </div>
          </div>

          {/* Notification Sound Selection */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--accent-blue-light)',
                color: 'var(--accent-blue)'
              }}>
                <Bell size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  Notification Alarm Tone
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Select the synthesizer sound for scheduled workout alarms.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={soundType}
                onChange={(e) => {
                  const newTone = e.target.value;
                  setSoundType(newTone);
                  audio.playAlarm(newTone);
                }}
                className="cyber-input"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  minWidth: '170px',
                  cursor: 'pointer'
                }}
              >
                <option value="modern-chime">Modern Chime (Crystal)</option>
                <option value="cyber-beep">Cyber Beep (Sci-Fi)</option>
                <option value="digital-alarm">Digital Alarm (Pulse)</option>
                <option value="high-voltage">High Voltage (Energetic)</option>
              </select>

              <button
                type="button"
                onClick={handlePreviewSound}
                disabled={previewingSound}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Play test audio sound"
              >
                <Play size={14} />
                <span>{previewingSound ? 'Playing...' : 'Test Audio'}</span>
              </button>
            </div>
          </div>

          {/* Theme Mode Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: theme === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                color: theme === 'dark' ? 'var(--accent-blue)' : '#eab308'
              }}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  Appearance Theme
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Toggle between Dark Cyber Mode and Clean Light Mode.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  background: theme === 'dark' ? 'var(--accent-cyan-light)' : 'transparent',
                  color: theme === 'dark' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Moon size={15} />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'light' ? '#3b82f6' : 'var(--border-subtle)'}`,
                  background: theme === 'light' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  color: theme === 'light' ? '#3b82f6' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Sun size={15} />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Reset App Data Action */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.04)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ef4444' }}>
                Clear Local Data & Reset App
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Reset workout logs, reminder schedules, and metric history to factory defaults.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setShowResetModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Trash2 size={15} />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting App Data */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="cyber-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(239, 68, 68, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{
                display: 'inline-flex',
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444'
              }}>
                <AlertTriangle size={22} />
              </span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Confirm Reset All Data?
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
              This action will reset your browser's local workout logs, custom reminders, and biometric metrics back to their initial starter templates. This cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setShowResetModal(false);
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
