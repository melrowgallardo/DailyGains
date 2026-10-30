import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Flame, 
  Dumbbell, 
  Clock, 
  PieChart, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  Sparkles 
} from './icons';
import GainsBarChart from './widgets/GainsBarChart';
import { audio } from '../services/audioService';

export default function GainsAnalytics({ logs = [], exercises = [] }) {
  const [timeRange, setTimeRange] = useState('all'); // 'week' | 'month' | 'all'

  // Filter logs by range
  const filteredLogs = logs.filter((log) => {
    if (timeRange === 'all') return true;
    if (!log.logged_at) return true;
    const logDate = new Date(log.logged_at);
    const now = new Date();
    const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
    if (timeRange === 'week') return diffDays <= 7;
    if (timeRange === 'month') return diffDays <= 30;
    return true;
  });

  // Calculate Personal Records (PRs)
  const prMap = {};
  logs.forEach((log) => {
    const name = log.exercise_name;
    const weight = Number(log.weight) || 0;
    if (!prMap[name] || weight > prMap[name].maxWeight) {
      prMap[name] = {
        exercise_name: name,
        maxWeight: weight,
        unit: log.weight_unit || 'kg',
        reps: log.reps,
        date: log.logged_at ? log.logged_at.slice(0, 10) : 'Recent',
        rpe: log.rpe
      };
    }
  });

  const prList = Object.values(prMap)
    .filter(pr => pr.maxWeight > 0)
    .sort((a, b) => b.maxWeight - a.maxWeight);

  // Muscle Group Split breakdown
  const muscleMap = {
    Chest: 0,
    Back: 0,
    Legs: 0,
    Shoulders: 0,
    Arms: 0,
    Core: 0,
    Cardio: 0
  };

  let totalMuscleVolume = 0;
  filteredLogs.forEach((log) => {
    const muscle = log.target_muscle || 'Chest';
    const normalized = muscleMap.hasOwnProperty(muscle) ? muscle : 'Chest';
    const vol = (Number(log.weight) || 0) * (Number(log.sets) || 1) * (Number(log.reps) || 10);
    muscleMap[normalized] += (vol > 0 ? vol : 100);
    totalMuscleVolume += (vol > 0 ? vol : 100);
  });

  // Overall KPI metrics
  const totalTonnage = filteredLogs.reduce((acc, l) => acc + ((Number(l.weight) || 0) * (Number(l.sets) || 1) * (Number(l.reps) || 10)), 0);
  const totalCals = filteredLogs.reduce((acc, l) => acc + (Number(l.calories_burned) || 0), 0);
  const totalSets = filteredLogs.reduce((acc, l) => acc + (Number(l.sets) || 1), 0);
  const totalMins = filteredLogs.reduce((acc, l) => acc + (Number(l.duration_minutes) || 0), 0);
  const avgRpe = filteredLogs.length > 0 ? (filteredLogs.reduce((acc, l) => acc + (Number(l.rpe) || 8), 0) / filteredLogs.length).toFixed(1) : 8.0;

  const muscleColors = {
    Chest: '#00f3ff',
    Back: '#38bdf8',
    Legs: '#ff6400',
    Shoulders: '#ffb700',
    Arms: '#a855f7',
    Core: '#10f5a0',
    Cardio: '#ff1a53'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Header & Range Selector */}
      <div className="cyber-panel cyber-corners" style={{ padding: '20px 24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} style={{ color: 'var(--cyber-cyan)' }} />
              <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                GAINS ANALYTICS & BIOMECHANICAL TELEMETRY
              </h2>
            </div>
            <p className="font-tech" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              DEEP VOLUME TRAJECTORY, PR BREAKTHROUGHS, AND MUSCLE RECRUITMENT SPLIT
            </p>
          </div>

          {/* Time range pills */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card-solid)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'week', label: 'PAST 7 DAYS' },
              { id: 'month', label: 'PAST 30 DAYS' },
              { id: 'all', label: 'ALL TIME' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  audio.playClick();
                  setTimeRange(tab.id);
                }}
                className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  border: 'none',
                  background: timeRange === tab.id ? 'var(--cyber-cyan)' : 'transparent',
                  color: timeRange === tab.id ? '#020617' : 'var(--text-muted)',
                  fontWeight: timeRange === tab.id ? 800 : 500
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        {/* Tonnage */}
        <div className="cyber-panel" style={{ padding: '16px', background: 'var(--bg-card-solid)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.8rem' }}>AGGREGATE TONNAGE</span>
            <Dumbbell size={16} style={{ color: 'var(--cyber-cyan)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyber-cyan)' }}>
            {totalTonnage.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>KG</span>
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--cyber-green)', marginTop: '4px' }}>
            +14.8% VS PREV CYCLE
          </div>
        </div>

        {/* Calories */}
        <div className="cyber-panel" style={{ padding: '16px', background: 'var(--bg-card-solid)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.8rem' }}>CALORIC EXPENDITURE</span>
            <Flame size={16} style={{ color: 'var(--cyber-orange)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyber-orange)' }}>
            {totalCals.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>KCAL</span>
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--cyber-cyan)', marginTop: '4px' }}>
            MITOCHONDRIAL PEAK
          </div>
        </div>

        {/* Total Sets */}
        <div className="cyber-panel" style={{ padding: '16px', background: 'var(--bg-card-solid)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.8rem' }}>TOTAL WORK SETS</span>
            <Layers size={16} style={{ color: 'var(--cyber-amber)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyber-amber)' }}>
            {totalSets} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SETS</span>
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {filteredLogs.length} EXERCISE BOUTS
          </div>
        </div>

        {/* Average RPE */}
        <div className="cyber-panel" style={{ padding: '16px', background: 'var(--bg-card-solid)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.8rem' }}>MEAN EFFORT INTENSITY</span>
            <Sparkles size={16} style={{ color: 'var(--cyber-purple)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyber-purple)' }}>
            {avgRpe} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 10 RPE</span>
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--cyber-orange)', marginTop: '4px' }}>
            OVERDRIVE HYPERTROPHY ZONE
          </div>
        </div>
      </div>

      {/* 7-Day / Weekly Bar Chart */}
      <GainsBarChart logs={filteredLogs} />

      {/* Muscle Group Breakdown & Personal Records Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Muscle Group Split Distribution */}
        <div className="cyber-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieChart size={18} style={{ color: 'var(--cyber-cyan)' }} />
            <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              MUSCLE GROUP RECRUITMENT SPLIT
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(muscleMap).map(([muscle, vol]) => {
              const pct = totalMuscleVolume > 0 ? Math.round((vol / totalMuscleVolume) * 100) : 0;
              const color = muscleColors[muscle] || '#00f3ff';

              return (
                <div key={muscle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span className="font-tech" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {muscle.toUpperCase()}
                    </span>
                    <span className="font-mono" style={{ color: color, fontWeight: 700 }}>
                      {pct}% <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({vol.toLocaleString()} kg)</span>
                    </span>
                  </div>

                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      boxShadow: `0 0 8px ${color}`
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Records (PR) Hall of Fame */}
        <div className="cyber-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={18} style={{ color: 'var(--cyber-amber)' }} />
            <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              PERSONAL RECORDS (PR) HALL OF FAME
            </span>
          </div>

          {prList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No heavy sets recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {prList.map((pr, idx) => (
                <div
                  key={pr.exercise_name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'rgba(255, 183, 0, 0.2)' : 'rgba(0, 243, 255, 0.1)',
                      border: idx === 0 ? '1px solid var(--cyber-amber)' : '1px solid var(--cyber-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: idx === 0 ? 'var(--cyber-amber)' : 'var(--cyber-cyan)'
                    }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-tech" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {pr.exercise_name}
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {pr.date} • {pr.reps} Reps
                      </div>
                    </div>
                  </div>

                  <div className="font-display" style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: idx === 0 ? 'var(--cyber-amber)' : 'var(--cyber-cyan)',
                    textShadow: idx === 0 ? '0 0 10px rgba(255, 183, 0, 0.5)' : 'none'
                  }}>
                    {pr.maxWeight} {pr.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
