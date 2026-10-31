import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Timer, Flame, BellRing } from '../icons';
import { audio } from '../../services/audioService';

export default function StopwatchTimer({ bpm = 125 }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [totalRestTarget, setTotalRestTarget] = useState(60);
  const restTimerRef = useRef(null);

  const caloriesBurned = Math.floor((elapsedMs / 1000 / 60) * (bpm * 0.08));

  // Stopwatch loop
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 50);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Rest Timer loop
  useEffect(() => {
    if (restSecondsLeft > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            audio.playTimerBeep(true);
            return 0;
          }
          if (prev <= 4) {
            audio.playTimerBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }
    return () => clearInterval(restTimerRef.current);
  }, [restSecondsLeft]);

  const toggleStopwatch = () => {
    audio.playClick();
    setIsRunning(!isRunning);
  };

  const resetStopwatch = () => {
    audio.playClick();
    setIsRunning(false);
    setElapsedMs(0);
  };

  const startRestTimer = (seconds) => {
    audio.playClick();
    setTotalRestTarget(seconds);
    setRestSecondsLeft(seconds);
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);

    const pad = (n) => String(n).padStart(2, '0');
    return {
      hms: `${hrs > 0 ? pad(hrs) + ':' : ''}${pad(mins)}:${pad(secs)}`,
      tenth: `.${tenths}`
    };
  };

  const timeDisplay = formatTime(elapsedMs);
  const restProgress = totalRestTarget > 0 ? ((totalRestTarget - restSecondsLeft) / totalRestTarget) * 100 : 0;

  return (
    <div className="cyber-panel" style={{ padding: '22px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-blue-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
            flexShrink: 0
          }}>
            <Timer size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Workout Stopwatch & Rest Timer
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Track set duration and recovery intervals
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '9999px',
          background: isRunning ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
          color: isRunning ? '#10b981' : 'var(--text-muted)',
          border: `1px solid ${isRunning ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`
        }}>
          {isRunning ? 'Running' : 'Ready'}
        </span>
      </div>

      {/* Modern Digital Clock Display */}
      <div style={{
        textAlign: 'center',
        padding: '16px 12px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        marginBottom: '14px'
      }}>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: isRunning ? 'var(--accent-cyan)' : 'var(--text-main)',
          lineHeight: 1,
          letterSpacing: '-0.02em'
        }}>
          {timeDisplay.hms}
          <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {timeDisplay.tenth}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame size={14} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {caloriesBurned} kcal
            </span>
            <span>burned</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Pace: {bpm} bpm</span>
          </div>
        </div>
      </div>

      {/* Main Stopwatch Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <button
          onClick={toggleStopwatch}
          className={`cyber-btn ${isRunning ? 'cyber-btn-orange' : 'cyber-btn-cyan'}`}
          style={{ width: '100%', borderRadius: '10px', padding: '10px 0' }}
        >
          {isRunning ? (
            <>
              <Pause size={16} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Start Session</span>
            </>
          )}
        </button>

        <button
          onClick={resetStopwatch}
          className="cyber-btn cyber-btn-ghost"
          style={{ width: '100%', borderRadius: '10px' }}
        >
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>
      </div>

      {/* Rest Countdown Interval Section */}
      <div style={{
        padding: '12px 14px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BellRing size={14} style={{ color: 'var(--accent-cyan)' }} />
            Rest Between Sets
          </span>
          {restSecondsLeft > 0 ? (
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
              {restSecondsLeft}s remaining
            </span>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Select interval
            </span>
          )}
        </div>

        {/* Rest progress bar */}
        {restSecondsLeft > 0 && (
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${restProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
              transition: 'width 1s linear'
            }} />
          </div>
        )}

        {/* Quick Rest presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[30, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => startRestTimer(sec)}
              style={{
                padding: '6px 0',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: restSecondsLeft > 0 && totalRestTarget === sec ? 'var(--accent-blue)' : 'var(--border-subtle)',
                background: restSecondsLeft > 0 && totalRestTarget === sec ? 'var(--accent-blue-light)' : 'var(--bg-card)',
                color: restSecondsLeft > 0 && totalRestTarget === sec ? 'var(--accent-blue)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
