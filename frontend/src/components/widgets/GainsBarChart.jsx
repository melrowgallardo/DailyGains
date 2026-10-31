import React, { useState } from 'react';
import { BarChart3 } from '../icons';
import { audio } from '../../services/audioService';

export default function GainsBarChart({ logs = [] }) {
  const [metric, setMetric] = useState('volume');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Build 7-day data points
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    
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

  const maxValue = Math.max(
    ...days.map(d => d[metric]),
    metric === 'volume' ? 5000 : metric === 'calories' ? 600 : 15
  );

  const getMetricColor = () => {
    if (metric === 'volume') return { bar: 'var(--accent-cyan)', unit: 'kg' };
    if (metric === 'calories') return { bar: 'var(--accent-blue)', unit: 'kcal' };
    return { bar: '#10b981', unit: 'sets' };
  };

  const metricInfo = getMetricColor();

  return (
    <div className="cyber-panel" style={{ padding: '22px 24px' }}>
      {/* Header with metric toggles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-cyan-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            flexShrink: 0
          }}>
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              7-Day Workout Activity
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Daily training volume and caloric burn trends
            </p>
          </div>
        </div>

        {/* Metric Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'volume', label: 'Volume (kg)' },
            { id: 'calories', label: 'Calories (kcal)' },
            { id: 'sets', label: 'Total Sets' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                audio.playClick();
                setMetric(m.id);
              }}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                background: metric === m.id ? 'var(--bg-card)' : 'transparent',
                color: metric === m.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: metric === m.id ? 600 : 500,
                boxShadow: metric === m.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Responsive Bar Chart */}
      <div style={{ position: 'relative', height: '170px', width: '100%' }}>
        <svg
          viewBox="0 0 700 170"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          {/* Subtle Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 140 - ratio * 120;
            return (
              <line
                key={ratio}
                x1="40"
                x2="680"
                y1={y}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Render Bars for each day */}
          {days.map((day, idx) => {
            const barWidth = 44;
            const x = 70 + idx * 88;
            const barHeight = Math.max(6, (day[metric] / maxValue) * 120);
            const y = 140 - barHeight;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={day.dateStr}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background Hover highlight */}
                {isHovered && (
                  <rect
                    x={x - 12}
                    y={15}
                    width={barWidth + 24}
                    height={130}
                    fill="rgba(6, 182, 212, 0.05)"
                    rx="8"
                  />
                )}

                {/* Primary Data Bar with smooth rounded corners */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isHovered ? 'var(--accent-blue)' : metricInfo.bar}
                  rx="6"
                  style={{
                    transition: 'all 0.2s ease',
                    opacity: day[metric] > 0 ? (isHovered ? 1 : 0.9) : 0.25
                  }}
                />

                {/* Day of Week Label */}
                <text
                  x={x + barWidth / 2}
                  y={160}
                  textAnchor="middle"
                  fill={day.isToday ? 'var(--accent-cyan)' : 'var(--text-muted)'}
                  fontSize="12"
                  fontWeight={day.isToday ? '700' : '500'}
                  fontFamily="var(--font-sans)"
                >
                  {day.label}
                </text>

                {/* Top value on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x + barWidth / 2 - 38}
                      y={Math.max(5, y - 26)}
                      width="76"
                      height="22"
                      rx="6"
                      fill="var(--bg-card)"
                      stroke="var(--border-subtle)"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={Math.max(5, y - 26) + 15}
                      textAnchor="middle"
                      fill="var(--text-main)"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="var(--font-sans)"
                    >
                      {day[metric].toLocaleString()} {metricInfo.unit}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
