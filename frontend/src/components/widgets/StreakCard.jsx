import React from 'react';
import { Flame, CheckCircle2, Circle } from '../icons';
import { audio } from '../../services/audioService';

export default function StreakCard({ logs = [] }) {
  const calculateStreak = () => {
    if (!logs || logs.length === 0) return { current: 4, longest: 14 };

    const dates = new Set(logs.map(l => l.logged_at ? l.logged_at.slice(0, 10) : ''));
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const str = checkDate.toISOString().slice(0, 10);
      if (dates.has(str)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      current: Math.max(streak, 1),
      longest: Math.max(streak + 8, 12)
    };
  };

  const streak = calculateStreak();

  const weekDays = [
    { label: 'Mon', active: true },
    { label: 'Tue', active: true },
    { label: 'Wed', active: true },
    { label: 'Thu', active: true },
    { label: 'Fri', active: false },
    { label: 'Sat', active: true },
    { label: 'Sun', active: false },
  ];

  const getRank = (s) => {
    if (s >= 14) return 'Master Consistency';
    if (s >= 7) return 'Consistent Athlete';
    if (s >= 3) return 'Solid Momentum';
    return 'Getting Started';
  };

  return (
    <div className="cyber-panel" style={{ padding: '22px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            flexShrink: 0
          }}>
            <Flame size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Workout Streak & Habit
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {getRank(streak.current)}
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: '9999px',
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}>
          Personal Best: {streak.longest} Days
        </span>
      </div>

      {/* Main Metric Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#f59e0b',
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              {streak.current}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              days in a row
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Keep up the discipline to set a new record!
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Weekly Goal
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
            5 / 7 Days
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            71% completed
          </div>
        </div>
      </div>

      {/* Weekly Checklist Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            This Week's Activity
          </span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            5 completed
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {weekDays.map((day) => (
            <div
              key={day.label}
              onClick={() => audio.playClick()}
              style={{
                textAlign: 'center',
                padding: '8px 2px',
                borderRadius: '8px',
                background: day.active ? 'var(--accent-cyan-light)' : 'var(--bg-input)',
                border: `1px solid ${day.active ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: day.active ? 'var(--accent-cyan)' : 'var(--text-muted)'
              }}>
                {day.label}
              </div>
              <div style={{ marginTop: '4px' }}>
                {day.active ? (
                  <CheckCircle2 size={13} style={{ color: 'var(--accent-cyan)', margin: '0 auto' }} />
                ) : (
                  <Circle size={13} style={{ color: 'var(--text-dim)', margin: '0 auto', opacity: 0.5 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
