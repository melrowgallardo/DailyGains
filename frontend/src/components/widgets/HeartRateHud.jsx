import React, { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Zap, Volume2, VolumeX, ShieldAlert } from '../icons';
import { audio } from '../../services/audioService';

export default function HeartRateHud({ bpm = 128, setBpm }) {
  const [currentBpm, setCurrentBpm] = useState(bpm);
  const [soundActive, setSoundActive] = useState(false);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pointsRef = useRef([]);

  // Sync internal and external state
  const handleBpmChange = (newBpm) => {
    setCurrentBpm(newBpm);
    if (setBpm) setBpm(newBpm);
  };

  // Heartbeat sound timer
  useEffect(() => {
    if (!soundActive) return;
    const intervalMs = (60 / currentBpm) * 1000;
    const timer = setInterval(() => {
      audio.playHeartbeat();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [soundActive, currentBpm]);

  // Canvas EKG Waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = canvas.parentElement.clientWidth || 360);
    let height = (canvas.height = 130);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 130;
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial flatline points
    pointsRef.current = new Array(width).fill(height / 2);
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw cyber grid lines
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Calculate next EKG sample based on BPM
      // Higher BPM = faster heart cycle repetition
      const cycleLength = Math.max(20, Math.floor(6000 / currentBpm));
      phase = (phase + 1) % cycleLength;

      let sampleY = height / 2;
      const progress = phase / cycleLength;

      // Realistic P-Q-R-S-T EKG wave model
      if (progress > 0.15 && progress < 0.22) {
        // P-wave (atrial depolarization)
        sampleY -= 8 * Math.sin(((progress - 0.15) / 0.07) * Math.PI);
      } else if (progress >= 0.25 && progress < 0.28) {
        // Q-dip
        sampleY += 6;
      } else if (progress >= 0.28 && progress < 0.34) {
        // R-peak (ventricular spike)
        const rProgress = (progress - 0.28) / 0.06;
        if (rProgress < 0.5) {
          sampleY -= 48 * (rProgress * 2);
        } else {
          sampleY -= 48 * (2 - rProgress * 2);
        }
      } else if (progress >= 0.34 && progress < 0.38) {
        // S-dip
        sampleY += 12;
      } else if (progress >= 0.45 && progress < 0.60) {
        // T-wave (ventricular repolarization)
        sampleY -= 14 * Math.sin(((progress - 0.45) / 0.15) * Math.PI);
      }

      // Add slight jitter for biological realism
      sampleY += (Math.random() - 0.5) * 1.5;

      // Shift waveform
      pointsRef.current.push(sampleY);
      if (pointsRef.current.length > width) {
        pointsRef.current.shift();
      }

      // Determine wave stroke color according to heart rate intensity
      let waveColor = '#00f3ff'; // Cyan default
      let glowColor = 'rgba(0, 243, 255, 0.4)';

      if (currentBpm >= 165) {
        waveColor = '#ff1a53'; // Crimson overclock
        glowColor = 'rgba(255, 26, 83, 0.6)';
      } else if (currentBpm >= 140) {
        waveColor = '#ff6400'; // Electric Orange
        glowColor = 'rgba(255, 100, 0, 0.5)';
      } else if (currentBpm >= 115) {
        waveColor = '#ffb700'; // Amber
        glowColor = 'rgba(255, 183, 0, 0.4)';
      }

      // Draw glow line
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      for (let i = 0; i < pointsRef.current.length; i++) {
        const x = i;
        const y = pointsRef.current[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lead scan dot
      const lastX = pointsRef.current.length - 1;
      const lastY = pointsRef.current[lastX];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentBpm]);

  // Determine Zone info
  const getZoneInfo = () => {
    if (currentBpm < 90) {
      return { name: 'RESTING PROTOCOL', color: 'var(--cyber-cyan)', tag: 'ZONE 1', badge: 'badge-cyan', burnRate: 2.2 };
    } else if (currentBpm < 120) {
      return { name: 'FAT OXIDATION ZONE', color: 'var(--cyber-green)', tag: 'ZONE 2', badge: 'badge-green', burnRate: 6.8 };
    } else if (currentBpm < 145) {
      return { name: 'AEROBIC / CARDIAC PACE', color: 'var(--cyber-amber)', tag: 'ZONE 3', badge: 'badge-orange', burnRate: 11.4 };
    } else if (currentBpm < 170) {
      return { name: 'ANAEROBIC THRESHOLD', color: 'var(--cyber-orange)', tag: 'ZONE 4', badge: 'badge-orange', burnRate: 15.6 };
    } else {
      return { name: 'OVERCLOCK // PEAK VO2 MAX', color: 'var(--cyber-crimson)', tag: 'ZONE 5', badge: 'badge-orange', burnRate: 20.2 };
    }
  };

  const zone = getZoneInfo();
  const pulseDuration = `${(60 / currentBpm).toFixed(2)}s`;

  return (
    <div className="cyber-panel cyber-corners" style={{ padding: '18px 20px' }}>
      {/* HUD Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} style={{ color: zone.color }} />
          <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            BIOMETRIC PULSE HUD
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              audio.playClick();
              setSoundActive(!soundActive);
            }}
            title={soundActive ? 'Disable heartbeat pulse audio' : 'Enable heartbeat pulse audio'}
            className="cyber-btn cyber-btn-ghost cyber-btn-sm"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          >
            {soundActive ? <Volume2 size={13} style={{ color: 'var(--cyber-cyan)' }} /> : <VolumeX size={13} />}
            <span className="font-tech">{soundActive ? 'SFX ON' : 'SFX MUTED'}</span>
          </button>
          <span className={`cyber-badge ${zone.badge}`}>
            {zone.tag}
          </span>
        </div>
      </div>

      {/* Main Metric & Animated Heart Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--bg-card-solid)',
        borderRadius: '6px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px'
      }}>
        {/* Heart + Digital BPM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            position: 'relative',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 100, 0, 0.1)',
            borderRadius: '50%',
            border: `1px solid ${zone.color}`
          }}>
            <Heart 
              size={24} 
              style={{
                color: zone.color,
                fill: zone.color,
                animation: `heartBeatPulse ${pulseDuration} ease-in-out infinite`
              }} 
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="font-display" style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                lineHeight: 1,
                color: zone.color,
                textShadow: `0 0 16px ${zone.color}`
              }}>
                {currentBpm}
              </span>
              <span className="font-tech" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                BPM
              </span>
            </div>
            <div className="font-tech" style={{ fontSize: '0.8rem', color: zone.color, fontWeight: 700, letterSpacing: '0.05em' }}>
              {zone.name}
            </div>
          </div>
        </div>

        {/* Metabolic Burn Rate */}
        <div style={{ textAlign: 'right' }}>
          <div className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            METABOLIC SURGE
          </div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ~{zone.burnRate} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>KCAL/MIN</span>
          </div>
          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--cyber-cyan)' }}>
            CARDIAC EFFICIENCY: 98.4%
          </div>
        </div>
      </div>

      {/* EKG Canvas Waveform */}
      <div style={{
        position: 'relative',
        height: '130px',
        width: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'rgba(2, 6, 23, 0.85)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px'
      }}>
        <div className="scanline-sweep" />
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* BPM Controls / Simulator Presets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="cyber-label" style={{ marginBottom: 0, fontSize: '0.75rem' }}>
            INTENSITY SIMULATOR / OVERCLOCK
          </span>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentBpm} / 200 BPM
          </span>
        </div>

        <input 
          type="range" 
          min="55" 
          max="200" 
          value={currentBpm} 
          onChange={(e) => handleBpmChange(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: zone.color,
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        />

        {/* Quick Zones Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {[
            { label: 'REST', bpm: 68 },
            { label: 'BURN', bpm: 115 },
            { label: 'AERO', bpm: 138 },
            { label: 'POWER', bpm: 162 },
            { label: 'MAX', bpm: 188 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                audio.playClick();
                handleBpmChange(preset.bpm);
              }}
              className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
              style={{
                padding: '4px 2px',
                fontSize: '0.7rem',
                borderColor: currentBpm === preset.bpm ? zone.color : 'var(--border-subtle)',
                background: currentBpm === preset.bpm ? 'rgba(0, 243, 255, 0.12)' : 'transparent',
                color: currentBpm === preset.bpm ? 'var(--cyber-cyan)' : 'var(--text-muted)'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
