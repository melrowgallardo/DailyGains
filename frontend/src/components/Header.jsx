import React from 'react';
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
  Plus 
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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'tracker', label: 'Tracker', icon: Dumbbell },
    { id: 'alarms', label: 'Reminders', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container-hud" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.35)',
              flexShrink: 0
            }}>
              <Dumbbell size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-main)'
                }}>
                  Daily<span style={{ color: 'var(--accent-cyan)' }}>Gains</span>
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  background: 'var(--accent-cyan-light)',
                  color: 'var(--accent-cyan)'
                }}>
                  FITNESS
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Bar with Clear Icon Labels */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--bg-input)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            maxWidth: '100%'
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
                    gap: '6px',
                    padding: '7px 14px',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} color={isActive ? 'var(--accent-cyan)' : 'currentColor'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Status, Audio, Theme & Prominent "+ Add Workout" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Database Connection Dot */}
            <div 
              onClick={() => handleNavClick('settings')}
              title={isOnline ? 'MySQL Connected' : 'Local Storage Mode'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '9999px',
                background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isOnline ? '#10b981' : '#f59e0b',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#f59e0b',
                boxShadow: isOnline ? '0 0 6px #10b981' : 'none'
              }} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Sound Toggle */}
            <button 
              onClick={handleMuteToggle}
              title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Theme Toggle (Dark / Light) */}
            <button 
              onClick={() => {
                audio.playClick();
                toggleTheme();
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-input)',
                color: theme === 'dark' ? 'var(--accent-amber)' : 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Prominent "+ Add Workout" Button */}
            {openQuickLog && (
              <button 
                onClick={() => {
                  audio.playClick();
                  openQuickLog();
                }}
                className="cyber-btn cyber-btn-cyan"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <Plus size={16} />
                <span>+ Add Workout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
