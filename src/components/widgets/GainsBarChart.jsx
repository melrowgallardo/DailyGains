import React, { useState } from 'react';
import { BarChart3, Calendar, Zap, Layers } from '../icons';
import { audio } from '../../services/audioService';

export default function GainsBarChart({ logs = [] }) {
  const [metric, setMetric] = useState('volume'); // 'volume' | 'calories' | 'sets'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Build 7-day data points (from 6 days ago up to today)
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    
    // Filter logs on this date
    const dayLogs = logs.filter(l => l.logged_at && l.logged_at.slice(0, 10) === dateStr);
    
    let vol = 0;
    let cals = 0;
    let sets = 0;

    dayLogs.forEach(l => {
      const w = Number(l.weight) || 0;
      const s = Number(l.sets) || 1;
      const r = Number(l.reps) || 10;
      vol += w * s * r;
      cals += Number(l.calories_burned) || 0;
      sets += s;
    });

    days.push({
      dateStr,
      label: dayLabel,
      volume: vol,
      calories: cals,
      sets: sets,
      exercisesCount: dayLogs.length,
      isToday: i === 0
    });
  }

  // Get max value for scaling
  const maxValue = Math.max(
    ...days.map(d => d[metric]),
    metric === 'volume' ? 5000 : metric === 'calories' ? 600 : 15
  );

  const getMetricColor = () => {
    if (metric === 'volume') return { bar: '#00f3ff', glow: 'rgba(0, 243, 255, 0.5)', unit: 'KG' };
    if (metric === 'calories') return { bar: '#ff6400', glow: 'rgba(255, 100, 0, 0.6)', unit: 'KCAL' };
    return { bar: '#ffb700', glow: 'rgba(255, 183, 0, 0.5)', unit: 'SETS' };
  };

  const metricInfo = getMetricColor();

  return (
    <div className="cyber-panel cyber-corners" style={{ padding: '18px 20px' }}>
      {/* Header with metric toggles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: metricInfo.bar }} />
          <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            7-DAY GAINS TELEMETRY
          </span>
        </div>

        {/* Metric Switcher */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card-solid)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'volume', label: 'VOLUME' },
            { id: 'calories', label: 'CALORIES' },
            { id: 'sets', label: 'SETS' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                audio.playClick();
                setMetric(m.id);
              }}
              className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
              style={{
                padding: '4px 8px',
                fontSize: '0.7rem',
                border: 'none',
                background: metric === m.id ? 'rgba(0, 243, 255, 0.15)' : 'transparent',
                color: metric === m.id ? metricInfo.bar : 'var(--text-muted)',
                fontWeight: metric === m.id ? 800 : 500
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div style={{ position: 'relative', width: '100%', height: '180px', marginTop: '10px' }}>
        <svg viewBox="0 0 700 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = 140 - pct * 120;
            return (
              <g key={idx}>
                <line 
                  x1="30" 
                  y1={y} 
                  x2="680" 
                  y2={y} 
                  stroke="rgba(0, 243, 255, 0.08)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x="20" 
                  y={y + 4} 
                  fill="var(--text-dim)" 
                  fontSize="11" 
                  fontFamily="var(--font-mono)" 
                  textAnchor="end"
                >
                  {Math.round(maxValue * pct)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {days.map((d, idx) => {
            const barWidth = 48;
            const x = 70 + idx * 88;
            const val = d[metric];
            const height = (val / maxValue) * 120;
            const y = 140 - height;
            const isHovered = hoveredIdx === idx;

            return (
              <g 
                key={d.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background column highlight on hover */}
                {isHovered && (
                  <rect
                    x={x - 10}
                    y={10}
                    width={barWidth + 20}
                    height={140}
                    fill="rgba(0, 243, 255, 0.05)"
                    rx="4"
                  />
                )}

                {/* Main Bar with cyber gradient */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(height, 4)}
                  rx="3"
                  fill={isHovered ? '#ffffff' : metricInfo.bar}
                  fillOpacity={val > 0 ? (isHovered ? 1 : 0.85) : 0.15}
                  style={{
                    filter: val > 0 ? `drop-shadow(0 0 8px ${metricInfo.glow})` : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />

                {/* Top cap glowing edge */}
                {val > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height="3"
                    rx="1.5"
                    fill="#ffffff"
                  />
                )}

                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y="162"
                  textAnchor="middle"
                  fill={d.isToday ? 'var(--cyber-cyan)' : 'var(--text-muted)'}
                  fontSize="12"
                  fontFamily="var(--font-tech)"
                  fontWeight={d.isToday ? '800' : '600'}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredIdx !== null && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'var(--bg-card-solid)',
            border: `1px solid ${metricInfo.bar}`,
            borderRadius: '6px',
            padding: '6px 12px',
            boxShadow: `0 0 12px ${metricInfo.glow}`,
            pointerEvents: 'none'
          }}>
            <div className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {days[hoveredIdx].dateStr} ({days[hoveredIdx].label})
            </div>
            <div className="font-display" style={{ fontSize: '1rem', color: metricInfo.bar, fontWeight: 800 }}>
              {days[hoveredIdx][metric].toLocaleString()} {metricInfo.unit}
            </div>
            <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--cyber-green)' }}>
              {days[hoveredIdx].exercisesCount} EXERCISES LOGGED
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
