import React from 'react';
import { Dumbbell, Flame, TrendingUp, Zap, Target } from '../icons';

export default function VolumeCalorieMeter({ logs = [] }) {
  // Aggregate stats from logs
  const stats = logs.reduce((acc, log) => {
    const weight = Number(log.weight) || 0;
    const sets = Number(log.sets) || 1;
    const reps = Number(log.reps) || 10;
    const vol = weight * sets * reps;
    const cals = Number(log.calories_burned) || 0;
    const mins = Number(log.duration_minutes) || 0;

    return {
      totalVolume: acc.totalVolume + vol,
      totalCalories: acc.totalCalories + cals,
      totalSets: acc.totalSets + sets,
      totalMinutes: acc.totalMinutes + mins
    };
  }, { totalVolume: 0, totalCalories: 0, totalSets: 0, totalMinutes: 0 });

  // Weekly target benchmarks
  const targetVolume = 25000; // 25,000 kg target
  const targetCalories = 3500; // 3,500 kcal target
  const volumePercent = Math.min(100, Math.round((stats.totalVolume / targetVolume) * 100));
  const caloriesPercent = Math.min(100, Math.round((stats.totalCalories / targetCalories) * 100));

  return (
    <div className="cyber-panel cyber-corners" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--cyber-cyan)' }} />
          <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            VOLUME & CALORIE FURNACE
          </span>
        </div>
        <span className="cyber-badge badge-cyan font-mono" style={{ fontSize: '0.72rem' }}>
          WEEKLY TARGETS
        </span>
      </div>

      {/* Main Meters Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Total Volume Meter */}
        <div style={{
          padding: '14px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              TOTAL TONNAGE
            </span>
            <Dumbbell size={15} style={{ color: 'var(--cyber-cyan)' }} />
          </div>

          <div className="font-display" style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'var(--cyber-cyan)',
            lineHeight: 1.1,
            marginBottom: '6px'
          }}>
            {stats.totalVolume.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>KG</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            <span>Target: {targetVolume.toLocaleString()} kg</span>
            <span className="font-mono" style={{ color: 'var(--cyber-cyan)', fontWeight: 700 }}>{volumePercent}%</span>
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${volumePercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00b8c4, var(--cyber-cyan))',
              boxShadow: 'var(--shadow-neon-cyan)'
            }} />
          </div>
        </div>

        {/* Caloric Furnace Meter */}
        <div style={{
          padding: '14px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              CALORIES BURNED
            </span>
            <Flame size={15} style={{ color: 'var(--cyber-orange)' }} />
          </div>

          <div className="font-display" style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'var(--cyber-orange)',
            lineHeight: 1.1,
            marginBottom: '6px'
          }}>
            {stats.totalCalories.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>KCAL</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            <span>Target: {targetCalories.toLocaleString()} kcal</span>
            <span className="font-mono" style={{ color: 'var(--cyber-orange)', fontWeight: 700 }}>{caloriesPercent}%</span>
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${caloriesPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffb700, var(--cyber-orange))',
              boxShadow: 'var(--shadow-neon-orange)'
            }} />
          </div>
        </div>
      </div>

      {/* Sub Metrics Ticker */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        textAlign: 'center'
      }}>
        <div style={{ padding: '8px', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.totalSets}
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            TOTAL SETS
          </div>
        </div>

        <div style={{ padding: '8px', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyber-amber)' }}>
            {stats.totalMinutes}m
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            UNDER TENSION
          </div>
        </div>

        <div style={{ padding: '8px', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyber-green)' }}>
            {logs.length}
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            EXECUTIONS
          </div>
        </div>
      </div>
    </div>
  );
}
