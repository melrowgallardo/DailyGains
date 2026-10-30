import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Dumbbell, 
  Bell, 
  BarChart3, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  Flame, 
  Clock 
} from './icons';
import { audio } from '../services/audioService';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  isOnline, 
  soundMuted, 
  setSoundMuted,
  openQuickLog
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'tracker', label: 'Workout Tracker', icon: Dumbbell },
    { id: 'alarms', label: 'Alarms / Protocols', icon: Bell },
    { id: 'analytics', label: 'Gains Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (tabId) => {
    audio.playClick();
    setActiveTab(tabId);
  };

  const handleMuteToggle = () => {
    const newMuted = !soundMuted;
    setSoundMuted(newMuted);
    audio.setMuted(newMuted);
    if (!newMuted) audio.playClick();
  };

  return (
    <header className="cyber-header" style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    }}>
      <div className="container-hud" style={{ paddingBottom: '0', paddingTop: '12px' }}>
        {/* Top Branding & Meta Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '12px'
        }}>
          {/* Logo & Identity */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          >
            <div style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid var(--cyber-cyan)',
              boxShadow: 'var(--shadow-neon-cyan)',
              flexShrink: 0
            }}>
              <img 
                src="/logo.jpg" 
                alt="DailyGains Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-display" style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  background: 'linear-gradient(90deg, #ffffff 0%, var(--cyber-cyan) 60%, var(--cyber-orange) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  DAILYGAINS
                </span>
                <span className="cyber-badge badge-orange font-mono" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  HUD V2.0
                </span>
              </div>
              <div className="font-tech" style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}>
                CYBERTECH GYM WORKOUT & BIOMETRIC SYSTEM
              </div>
            </div>
          </div>

          {/* System Telemetry & Control Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Live Clock */}
            <div className="font-mono cyber-panel" style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--cyber-cyan)',
              border: '1px solid rgba(0, 243, 255, 0.2)'
            }}>
              <Clock size={14} style={{ color: 'var(--cyber-cyan)' }} />
              <span>{timeStr || '00:00:00'}</span>
            </div>

            {/* DB Status Badge */}
            <div 
              onClick={() => handleNavClick('settings')}
              title="Click to view database & API settings"
              className={`cyber-badge ${isOnline ? 'badge-green' : 'badge-orange'}`}
              style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              {isOnline ? (
                <>
                  <Wifi size={13} />
                  <span>XAMPP MYSQL ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} />
                  <span>LOCAL OFFLINE MODE</span>
                </>
              )}
            </div>

            {/* Audio Toggle */}
            <button 
              onClick={handleMuteToggle}
              title={soundMuted ? 'Unmute Audio Synthesizer' : 'Mute Audio Synthesizer'}
              className="cyber-btn cyber-btn-ghost cyber-btn-sm"
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} style={{ color: 'var(--cyber-cyan)' }} />}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={() => {
                audio.playClick();
                toggleTheme();
              }}
              title={theme === 'dark' ? 'Switch to Lab Light Mode' : 'Switch to Cyberpunk Dark Mode'}
              className="cyber-btn cyber-btn-ghost cyber-btn-sm"
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              {theme === 'dark' ? (
                <Sun size={16} style={{ color: 'var(--cyber-amber)' }} />
              ) : (
                <Moon size={16} style={{ color: 'var(--cyber-cyan)' }} />
              )}
            </button>

            {/* Fast Quick Log CTA */}
            {openQuickLog && (
              <button 
                onClick={() => {
                  audio.playClick();
                  openQuickLog();
                }}
                className="cyber-btn cyber-btn-orange cyber-btn-sm font-display"
                style={{ padding: '7px 14px' }}
              >
                <Flame size={14} />
                <span>+ LOG SET</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: isActive ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                  color: isActive ? 'var(--cyber-cyan)' : 'var(--text-muted)',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--cyber-cyan)' : '3px solid transparent',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--cyber-cyan)' : 'inherit' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
