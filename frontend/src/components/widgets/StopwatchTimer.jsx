import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Timer, Flame, BellRing } from '../icons';
import { audio } from '../../services/audioService';

export default function StopwatchTimer({ bpm = 125 }) {
  // Main Session Stopwatch State
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  // Set Rest Interval Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [totalRestTarget, setTotalRestTarget] = useState(60);
  const restTimerRef = useRef(null);

  // Active calories estimation (based on duration & BPM)
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
            audio.playTimerBeep(true); // Final high alert beep
            return 0;
          }
          if (prev <= 4) {
            audio.playTimerBeep(false); // Countdown warning beeps 3, 2, 1
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

  // Format HH:MM:SS
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
    <div className="cyber-panel cyber-corners" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Timer size={18} style={{ color: 'var(--cyber-orange)' }} />
          <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            SESSION CHRONOMETER
          </span>
        </div>
        <span className={`cyber-badge ${isRunning ? 'badge-green' : 'badge-orange'}`}>
          {isRunning ? 'RECORDING PROTOCOL' : 'STANDBY'}
        </span>
      </div>

      {/* Big Digital Display */}
      <div style={{
        textAlign: 'center',
        padding: '16px 12px',
        background: 'var(--bg-card-solid)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        marginBottom: '14px'
      }}>
        <div className="font-display" style={{
          fontSize: '2.6rem',
          fontWeight: 900,
          letterSpacing: '0.05em',
          color: isRunning ? 'var(--cyber-cyan)' : 'var(--text-main)',
          textShadow: isRunning ? 'var(--shadow-neon-cyan)' : 'none',
          lineHeight: 1
        }}>
          {timeDisplay.hms}
          <span style={{ fontSize: '1.4rem', opacity: 0.65, color: 'var(--text-muted)' }}>
            {timeDisplay.tenth}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame size={14} style={{ color: 'var(--cyber-orange)' }} />
            <span className="font-mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {caloriesBurned}
            </span>
            <span className="font-tech">KCAL ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={14} style={{ color: 'var(--cyber-cyan)' }} />
            <span className="font-tech">AVG {bpm} BPM</span>
          </div>
        </div>
      </div>

      {/* Main Stopwatch Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={toggleStopwatch}
          className={`cyber-btn ${isRunning ? 'cyber-btn-orange' : 'cyber-btn-cyan'}`}
          style={{ width: '100%' }}
        >
          {isRunning ? (
            <>
              <Pause size={16} />
              <span>PAUSE SESSION</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>START SESSION</span>
            </>
          )}
        </button>

        <button
          onClick={resetStopwatch}
          className="cyber-btn cyber-btn-ghost"
          style={{ width: '100%' }}
        >
          <RotateCcw size={15} />
          <span>RESET</span>
        </button>
      </div>

      {/* Set Rest Countdown Timer Section */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(2, 6, 23, 0.5)',
        border: '1px dashed var(--border-subtle)',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="font-tech" style={{ fontSize: '0.8rem', color: 'var(--cyber-amber)', fontWeight: 700 }}>
            <BellRing size={13} style={{ display: 'inline', marginRight: '5px' }} />
            INTER-SET REST PROTOCOL
          </span>
          {restSecondsLeft > 0 ? (
            <span className="font-display" style={{ fontSize: '1rem', color: 'var(--cyber-orange)', fontWeight: 800 }}>
              {restSecondsLeft}s RESTING
            </span>
          ) : (
            <span className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              READY FOR SET
            </span>
          )}
        </div>

        {/* Rest progress bar */}
        {restSecondsLeft > 0 && (
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${restProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-orange))',
              boxShadow: '0 0 10px var(--cyber-orange)',
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
              className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
              style={{
                padding: '4px 0',
                fontSize: '0.75rem',
                borderColor: restSecondsLeft > 0 && totalRestTarget === sec ? 'var(--cyber-orange)' : 'var(--border-subtle)',
                color: restSecondsLeft > 0 && totalRestTarget === sec ? 'var(--cyber-orange)' : 'var(--text-muted)'
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
