import React from 'react';
import { Play, Flame, Dumbbell, Zap, Plus, ArrowRight, Activity, Award } from './icons';
import HeartRateHud from './widgets/HeartRateHud';
import StopwatchTimer from './widgets/StopwatchTimer';
import StreakCard from './widgets/StreakCard';
import VolumeCalorieMeter from './widgets/VolumeCalorieMeter';
import GainsBarChart from './widgets/GainsBarChart';
import { audio } from '../services/audioService';

export default function Dashboard({ 
  logs = [], 
  exercises = [], 
  openLogModal, 
  setActiveTab,
  deleteLog,
  bpm,
  setBpm
}) {
  // Quick exercise launches
  const popularExercises = exercises.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Hero Banner with Logo.jpg and Cyber Gym Aesthetics */}
      <div className="cyber-panel cyber-corners" style={{
        position: 'relative',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(10, 16, 36, 0.95) 0%, rgba(2, 6, 23, 0.9) 100%)',
        border: '1px solid var(--border-active)',
        boxShadow: '0 8px 32px rgba(0, 243, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Left copy */}
        <div style={{ flex: '1 1 360px', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="cyber-badge badge-cyan font-mono">
              SYSTEM STATUS: ARMED
            </span>
            <span className="cyber-badge badge-orange font-mono">
              OVERCLOCK READY
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: '2.1rem',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '8px',
            color: 'var(--text-main)'
          }}>
            WELCOME TO <span style={{ color: 'var(--cyber-cyan)', textShadow: 'var(--shadow-neon-cyan)' }}>DAILYGAINS</span>
          </h1>

          <p className="font-tech" style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            marginBottom: '18px',
            letterSpacing: '0.04em'
          }}>
            Synchronize your biometric cardiac telemetry, track mechanical volume hypertrophy, and maintain uninterrupted protocol discipline.
          </p>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                audio.playClick();
                openLogModal();
              }}
              className="cyber-btn cyber-btn-cyan font-display"
              style={{ padding: '10px 20px' }}
            >
              <Plus size={16} />
              <span>LOG WORKOUT SET</span>
            </button>

            <button
              onClick={() => {
                audio.playClick();
                setActiveTab('tracker');
              }}
              className="cyber-btn cyber-btn-ghost font-display"
              style={{ padding: '10px 18px' }}
            >
              <Dumbbell size={16} />
              <span>VIEW FULL PROTOCOL</span>
            </button>
          </div>
        </div>

        {/* Right Cyborg Logo Hero Showcase */}
        <div style={{
          position: 'relative',
          width: '240px',
          height: '140px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid var(--cyber-orange)',
          boxShadow: 'var(--shadow-neon-orange)',
          flexShrink: 0
        }}>
          <img 
            src="/logo.jpg" 
            alt="DailyGains Cyborg Mascot" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'linear-gradient(transparent, rgba(2, 6, 23, 0.95))',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-tech)',
            fontWeight: 700,
            color: 'var(--cyber-orange)',
            textAlign: 'center'
          }}>
            BIOMETRIC CYBERCORE // ACTIVATED
          </div>
        </div>
      </div>

      {/* Primary Biometric & Time HUD Row (2 columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Heart Rate HUD Meter */}
        <HeartRateHud bpm={bpm} setBpm={setBpm} />

        {/* Stopwatch Session Timer */}
        <StopwatchTimer bpm={bpm} />
      </div>

      {/* Progress & Consistency Telemetry Row (2 columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Volume & Calories Gauge */}
        <VolumeCalorieMeter logs={logs} />

        {/* Cyber Streak & Discipline */}
        <StreakCard logs={logs} />
      </div>

      {/* 7-Day Gains Telemetry Bar Chart */}
      <GainsBarChart logs={logs} />

      {/* Quick Launch Exercises Bar */}
      <div className="cyber-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--cyber-orange)' }} />
            <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              QUICK LAUNCH EXERCISES
            </span>
          </div>
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('tracker');
            }}
            className="cyber-btn cyber-btn-ghost cyber-btn-sm font-tech"
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            <span>ALL EXERCISES</span>
            <ArrowRight size={13} />
          </button>
        </div>

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
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--cyber-cyan)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div className="font-tech" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {ex.name}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                  <span className="cyber-badge badge-cyan font-mono" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                    {ex.target_muscle}
                  </span>
                  <span className="cyber-badge badge-orange font-mono" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                    {ex.equipment}
                  </span>
                </div>
              </div>
              <button 
                className="cyber-btn cyber-btn-cyan cyber-btn-sm" 
                style={{ width: '32px', height: '32px', padding: 0 }}
                title="Log this exercise"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Execution Logs Quick View */}
      <div className="cyber-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--cyber-cyan)' }} />
            <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              RECENT WORKOUT EXECUTION LOGS
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            LATEST {Math.min(logs.length, 5)} OF {logs.length} RECORDS
          </span>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            <Dumbbell size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <div className="font-tech" style={{ fontSize: '1rem' }}>NO WORKOUTS RECORDED YET</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hit the button below to record your first set!</div>
            <button
              onClick={() => openLogModal()}
              className="cyber-btn cyber-btn-cyan font-display"
              style={{ marginTop: '12px' }}
            >
              + LOG FIRST SET
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: 'rgba(0, 243, 255, 0.1)',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cyber-cyan)'
                  }}>
                    <Dumbbell size={18} />
                  </div>
                  <div>
                    <div className="font-tech" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {log.exercise_name}
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {log.logged_at ? log.logged_at.slice(0, 16) : 'Just now'} • RPE {log.rpe || 8}/10
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cyber-cyan)' }}>
                      {log.sets} SETS × {log.reps} REPS @ {log.weight} {log.weight_unit || 'kg'}
                    </div>
                    <div className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--cyber-orange)' }}>
                      {log.calories_burned || 0} KCAL • {log.duration_minutes || 0} MINS
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
