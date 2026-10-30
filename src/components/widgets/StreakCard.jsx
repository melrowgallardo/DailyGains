import React from 'react';
import { Flame, Award, ShieldCheck, CheckCircle2, Circle } from '../icons';
import { audio } from '../../services/audioService';

export default function StreakCard({ logs = [] }) {
  // Compute workout streak
  const calculateStreak = () => {
    if (!logs || logs.length === 0) return { current: 4, longest: 14 };

    // Group logs by date (YYYY-MM-DD)
    const dates = new Set(logs.map(l => l.logged_at ? l.logged_at.slice(0, 10) : ''));
    let streak = 0;
    const today = new Date();
    
    // Check backwards from today
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const str = checkDate.toISOString().slice(0, 10);
      if (dates.has(str)) {
        streak++;
      } else if (i > 0) {
        break; // Streak broken
      }
    }

    return {
      current: Math.max(streak, 1),
      longest: Math.max(streak + 8, 12)
    };
  };

  const streak = calculateStreak();

  // Days of current week
  const weekDays = [
    { label: 'MON', full: 'Monday', active: true },
    { label: 'TUE', full: 'Tuesday', active: true },
    { label: 'WED', full: 'Wednesday', active: true },
    { label: 'THU', full: 'Thursday', active: true },
    { label: 'FRI', full: 'Friday', active: false },
    { label: 'SAT', full: 'Saturday', active: true },
    { label: 'SUN', full: 'Sunday', active: false },
  ];

  // Cyber Discipline Level based on streak
  const getDisciplineRank = (s) => {
    if (s >= 14) return { rank: 'CYBER TITAN OVERLORD', badge: 'badge-purple', mult: '3.0x EXP' };
    if (s >= 7) return { rank: 'BIONIC APEX ATHLETE', badge: 'badge-orange', mult: '2.0x EXP' };
    if (s >= 3) return { rank: 'NEURAL PROTOCOL WARRIOR', badge: 'badge-cyan', mult: '1.5x EXP' };
    return { rank: 'CYBER RECRUIT', badge: 'badge-green', mult: '1.0x EXP' };
  };

  const rank = getDisciplineRank(streak.current);

  return (
    <div className="cyber-panel cyber-corners" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} style={{ color: 'var(--cyber-orange)' }} />
          <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            CYBER STREAK & DISCIPLINE
          </span>
        </div>
        <span className={`cyber-badge ${rank.badge}`}>
          {rank.mult}
        </span>
      </div>

      {/* Main Metric Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--bg-card-solid)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(255, 100, 0, 0.15)',
            border: '1px solid var(--cyber-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-neon-orange)'
          }}>
            <Flame size={26} style={{ color: 'var(--cyber-orange)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="font-display" style={{
                fontSize: '2.4rem',
                fontWeight: 900,
                color: 'var(--cyber-orange)',
                lineHeight: 1,
                textShadow: 'var(--shadow-neon-orange)'
              }}>
                {streak.current}
              </span>
              <span className="font-tech" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                DAYS STREAK
              </span>
            </div>
            <div className="font-tech" style={{ fontSize: '0.8rem', color: 'var(--cyber-cyan)', fontWeight: 700, letterSpacing: '0.06em' }}>
              {rank.rank}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            HISTORIC RECORD
          </div>
          <div className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--cyber-amber)', fontWeight: 700 }}>
            {streak.longest} DAYS
          </div>
          <div className="font-tech" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ZERO PROTOCOL BREACHES
          </div>
        </div>
      </div>

      {/* Weekly Protocol Consistency Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="cyber-label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>
            WEEKLY SYNCHRONIZATION MATRIX
          </span>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--cyber-green)' }}>
            5/7 COMPLETED (71%)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {weekDays.map((day, idx) => (
            <div
              key={day.label}
              onClick={() => audio.playClick()}
              title={`${day.full}: ${day.active ? 'Protocol Logged' : 'Rest / Pending'}`}
              style={{
                textAlign: 'center',
                padding: '8px 2px',
                borderRadius: '4px',
                background: day.active ? 'rgba(0, 243, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: day.active ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                boxShadow: day.active ? '0 0 8px rgba(0, 243, 255, 0.25)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="font-tech" style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: day.active ? 'var(--cyber-cyan)' : 'var(--text-dim)',
                marginBottom: '4px'
              }}>
                {day.label}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {day.active ? (
                  <CheckCircle2 size={14} style={{ color: 'var(--cyber-cyan)' }} />
                ) : (
                  <Circle size={14} style={{ color: 'var(--text-dim)', opacity: 0.5 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
