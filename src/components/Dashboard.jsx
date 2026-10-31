import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, ArrowRight, Zap, Flame, Calendar, Activity, Sparkles, User, Target } from './icons';
import StopwatchTimer from './widgets/StopwatchTimer';
import StreakCard from './widgets/StreakCard';
import GainsBarChart from './widgets/GainsBarChart';
import QuickWorkoutReminder from './widgets/QuickWorkoutReminder';
import UserProfileBiometricCard from './widgets/UserProfileBiometricCard';
import { audio } from '../services/audioService';
import { programTracker } from '../services/programTrackerService';

export default function Dashboard({ 
  logs = [], 
  exercises = [], 
  reminders = [],
  saveReminder,
  deleteReminder,
  userMetrics,
  saveUserMetrics,
  userProfile,
  saveUserProfile,
  openLogModal, 
  setActiveTab,
  bpm = 125
}) {
  const [reminderPrefill, setReminderPrefill] = useState(null);
  const popularExercises = exercises.slice(0, 4);

  // Program Routine Day State
  const [programData, setProgramData] = useState(() => programTracker.getProgramData());

  useEffect(() => {
    const unsubscribe = programTracker.subscribe((updated) => {
      setProgramData(updated);
    });
    const handleSync = (e) => {
      if (e.detail) setProgramData(e.detail);
    };
    window.addEventListener('dailygains_program_changed', handleSync);
    return () => {
      unsubscribe();
      window.removeEventListener('dailygains_program_changed', handleSync);
    };
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Minimalist Welcome Banner with Quick Stats & Smooth Action Buttons */}
      <div className="cyber-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-subtle) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Left Information & Actions */}
        <div style={{ flex: '1 1 360px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: '9999px',
              background: 'var(--accent-cyan-light)',
              color: 'var(--accent-cyan)'
            }}>
              <Calendar size={13} />
              <span>{formattedDate}</span>
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: '9999px',
              background: 'var(--accent-blue-light)',
              color: 'var(--accent-blue)'
            }}>
              <Activity size={13} />
              <span>{logs.length} Total Workouts</span>
            </span>

            {/* Routine Day Progression Badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '9999px',
              background: programData.phase.bgColor,
              border: `1px solid ${programData.phase.borderColor}`,
              color: programData.phase.color
            }}>
              <Target size={13} />
              <span>{programData.phase.dayProgress} • {programData.phase.phaseName}</span>
            </span>
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 6px',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em'
          }}>
            Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{userProfile?.user_name || 'Athlete'}</span>
          </h1>

          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            margin: '0 0 18px',
            lineHeight: 1.5
          }}>
            Track your workout progress, monitor your biometrics, and stay consistent with daily routine reminders.
          </p>

          {/* Smooth Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                audio.playClick();
                openLogModal();
              }}
              className="cyber-btn cyber-btn-cyan"
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              <Plus size={16} />
              <span>+ Log Workout</span>
            </button>

            <button
              onClick={() => {
                audio.playClick();
                setActiveTab('tracker');
              }}
              className="cyber-btn cyber-btn-ghost"
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              <Dumbbell size={16} />
              <span>View Workout Log</span>
            </button>
          </div>
        </div>

        {/* Right Thumbnail Showcase */}
        <div style={{
          position: 'relative',
          width: '180px',
          height: '110px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          flexShrink: 0
        }}>
          <img 
            src="/logo.jpg" 
            alt="DailyGains Mascot" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.9))',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center'
          }}>
            Consistent Daily Progress
          </div>
        </div>
      </div>

      {/* 2. Top Row: User Profile & Biometrics Card (with Nested Recommendations) + Quick Workout Reminder Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* User Profile & Biometrics Card with Live BMI, Quick Edit & Nested Recommendations */}
        <UserProfileBiometricCard
          userProfile={userProfile}
          userMetrics={userMetrics}
          onSaveMetrics={saveUserMetrics}
          onSaveProfile={saveUserProfile}
          onAddToReminder={(rec) => {
            setReminderPrefill(rec);
          }}
          onStartWorkout={(rec) => {
            openLogModal({
              name: rec.name,
              category: rec.category,
              target_muscle: rec.target_muscle || rec.muscles || rec.category,
              equipment: rec.equipment
            });
          }}
        />

        {/* Quick Workout Reminder Card */}
        <QuickWorkoutReminder
          exercises={exercises}
          reminders={reminders}
          onSaveReminder={saveReminder}
          onDeleteReminder={deleteReminder}
          setActiveTab={setActiveTab}
          prefillData={reminderPrefill}
        />
      </div>

      {/* 3. Operational Telemetry Row: Stopwatch & Weekly Streak Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        <StopwatchTimer bpm={bpm} />
        <StreakCard logs={logs} />
      </div>

      {/* 4. 7-Day Gains Telemetry Bar Chart */}
      <GainsBarChart logs={logs} />

      {/* 5. Quick Launch Exercises Bar */}
      <div className="cyber-panel" style={{ padding: '20px 24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0
            }}>
              Quick Launch Exercises
            </h3>
          </div>
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('tracker');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>All Exercises</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {popularExercises.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 12px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            background: 'var(--bg-input)',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)'
          }}>
            No exercises registered yet. Click &quot;+ Add Workout&quot; or go to Tracker to log your first exercise!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {popularExercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => {
                audio.playClick();
                openLogModal(ex);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  {ex.name}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    background: 'var(--accent-cyan-light)',
                    color: 'var(--accent-cyan)'
                  }}>
                    {ex.target_muscle}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    background: 'var(--accent-blue-light)',
                    color: 'var(--accent-blue)'
                  }}>
                    {ex.equipment}
                  </span>
                </div>
              </div>
              <button 
                className="cyber-btn cyber-btn-cyan cyber-btn-sm" 
                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px' }}
                title="Log this exercise"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
