import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  Clock, 
  Volume2, 
  Check, 
  AlertCircle, 
  Play, 
  ShieldCheck, 
  Zap, 
  Calendar 
} from './icons';
import { audio } from '../services/audioService';

export default function AlarmsReminders({ 
  reminders = [], 
  saveReminder, 
  deleteReminder 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('Morning Hypertrophy Protocol');
  const [time, setTime] = useState('06:30');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [sound, setSound] = useState('cyber-siren');
  const [isActive, setIsActive] = useState(true);

  // Active Alert Trigger Modal
  const [triggeredAlarm, setTriggeredAlarm] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const soundOptions = [
    { id: 'cyber-siren', name: 'Cyber Siren (Alternating Sweep)' },
    { id: 'pulse-alarm', name: 'Pulse Alarm (Rapid Cardiac Alert)' },
    { id: 'high-voltage', name: 'High-Voltage Chime (Ascending Power)' },
    { id: 'quantum-ping', name: 'Quantum Ping (Crystal Resonance)' },
    { id: 'drill-sergeant', name: 'Drill Sergeant (Tactical Staccato)' },
  ];

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    audio.playClick();
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('DailyGains Protocol System', {
          body: 'Biometric daily alarms authorized and linked.',
          icon: '/logo.jpg'
        });
      }
    }
  };

  // Real-time protocol alarm checker loop
  useEffect(() => {
    let lastCheckedMinute = '';

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${mins}`;

      // Avoid re-triggering in the same minute
      if (currentTimeStr === lastCheckedMinute) return;

      reminders.forEach((r) => {
        if (!r.is_active) return;
        const rDays = typeof r.days === 'string' ? r.days.split(',') : (r.days || []);
        if (rDays.includes(currentDay) && r.time === currentTimeStr) {
          lastCheckedMinute = currentTimeStr;
          triggerAlarmAlert(r);
        }
      });
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [reminders]);

  const triggerAlarmAlert = (rem) => {
    setTriggeredAlarm(rem);
    audio.playAlarm(rem.sound);

    // Browser Push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`DAILYGAINS PROTOCOL ALERT: ${rem.title}`, {
        body: `Time to initialize training session at ${rem.time}!`,
        icon: '/logo.jpg'
      });
    }
  };

  const toggleDay = (d) => {
    audio.playClick();
    if (selectedDays.includes(d)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(day => day !== d));
      }
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  };

  const handlePreviewSound = (s) => {
    audio.playAlarm(s || sound);
  };

  const openNewForm = () => {
    audio.playClick();
    setEditingId(null);
    setTitle('Daily Hypertrophy Protocol');
    setTime('07:00');
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setSound('cyber-siren');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const openEditForm = (rem) => {
    audio.playClick();
    setEditingId(rem.id);
    setTitle(rem.title);
    setTime(rem.time);
    const parsedDays = typeof rem.days === 'string' ? rem.days.split(',') : (rem.days || ['Mon', 'Tue', 'Wed']);
    setSelectedDays(parsedDays);
    setSound(rem.sound || 'cyber-siren');
    setIsActive(Boolean(rem.is_active));
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    audio.playSuccess();

    await saveReminder({
      id: editingId,
      title: title.trim(),
      time,
      days: selectedDays.join(','),
      sound,
      is_active: isActive ? 1 : 0
    });

    setIsFormOpen(false);
  };

  const handleToggleActive = async (rem) => {
    audio.playClick();
    await saveReminder({
      ...rem,
      is_active: rem.is_active ? 0 : 1
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner & Protocol Info */}
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
              <BellRing size={20} style={{ color: 'var(--cyber-orange)' }} />
              <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                DAILY PROTOCOL ALARMS & REMINDERS
              </h2>
            </div>
            <p className="font-tech" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              SCHEDULE DAILY RECURRING WORKOUT DISCIPLINE NOTIFICATIONS AND AUDIO SIGNALS
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Notification Permission button */}
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="cyber-btn cyber-btn-ghost cyber-btn-sm font-tech"
                style={{ borderColor: 'var(--cyber-amber)', color: 'var(--cyber-amber)' }}
              >
                <Zap size={14} />
                <span>ENABLE BROWSER NOTIFICATIONS</span>
              </button>
            )}

            <button
              onClick={openNewForm}
              className="cyber-btn cyber-btn-orange font-display"
            >
              <Plus size={16} />
              <span>+ NEW WORKOUT ALARM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="cyber-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="font-tech" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            CONFIGURED PROTOCOL TIMERS ({reminders.length})
          </span>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--cyber-cyan)' }}>
            REALTIME LISTENER: ACTIVE
          </span>
        </div>

        {reminders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <div className="font-tech" style={{ fontSize: '1.1rem' }}>NO SCHEDULED WORKOUT PROTOCOLS</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Create your first daily workout reminder!</div>
            <button
              onClick={openNewForm}
              className="cyber-btn cyber-btn-orange font-display"
              style={{ marginTop: '14px' }}
            >
              + CREATE REMINDER
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reminders.map((rem) => {
              const rDays = typeof rem.days === 'string' ? rem.days.split(',') : (rem.days || []);
              const isActive = Boolean(rem.is_active);

              return (
                <div
                  key={rem.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--bg-card-solid)',
                    border: `1px solid ${isActive ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: '8px',
                    opacity: isActive ? 1 : 0.6,
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (isActive) e.currentTarget.style.borderColor = 'var(--cyber-orange)';
                  }}
                  onMouseLeave={(e) => {
                    if (isActive) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {/* Left: Time & Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(255, 100, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isActive ? 'var(--cyber-orange)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? 'var(--cyber-orange)' : 'var(--text-dim)',
                      flexShrink: 0
                    }}>
                      <Clock size={24} />
                    </div>

                    <div>
                      <div className="font-display" style={{
                        fontSize: '1.85rem',
                        fontWeight: 900,
                        lineHeight: 1,
                        color: isActive ? 'var(--cyber-orange)' : 'var(--text-muted)'
                      }}>
                        {rem.time}
                      </div>

                      <div className="font-tech" style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginTop: '4px'
                      }}>
                        {rem.title}
                      </div>

                      {/* Day Badges */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {daysOfWeek.map((day) => {
                          const isSelected = rDays.includes(day);
                          return (
                            <span
                              key={day}
                              className={`cyber-badge ${isSelected ? (isActive ? 'badge-orange' : 'badge-cyan') : ''}`}
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                background: isSelected ? undefined : 'transparent',
                                border: isSelected ? undefined : '1px solid var(--border-subtle)',
                                color: isSelected ? undefined : 'var(--text-dim)'
                              }}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Sound Preview, Toggle Switch, Edit, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Audio Preview */}
                    <button
                      onClick={() => handlePreviewSound(rem.sound)}
                      title={`Preview sound: ${rem.sound || 'cyber-siren'}`}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    >
                      <Volume2 size={14} style={{ color: 'var(--cyber-cyan)' }} />
                      <span className="font-tech">TEST SFX</span>
                    </button>

                    {/* Active Toggle Switch */}
                    <button
                      onClick={() => handleToggleActive(rem)}
                      className={`cyber-badge ${isActive ? 'badge-green' : 'badge-orange'}`}
                      style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      {isActive ? 'ARMED' : 'DISABLED'}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openEditForm(rem)}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm font-tech"
                      style={{ padding: '6px 10px' }}
                    >
                      EDIT
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        audio.playClick();
                        if (window.confirm(`Delete reminder "${rem.title}"?`)) {
                          deleteReminder(rem.id);
                        }
                      }}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ color: 'var(--cyber-crimson)', borderColor: 'rgba(255, 26, 83, 0.3)', padding: '6px 10px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT ALARM MODAL */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="cyber-panel cyber-corners" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '24px 26px',
            background: 'var(--bg-surface)',
            border: '2px solid var(--cyber-orange)',
            boxShadow: 'var(--shadow-neon-orange)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BellRing size={22} style={{ color: 'var(--cyber-orange)' }} />
                <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                  {editingId ? 'UPDATE WORKOUT PROTOCOL' : 'SCHEDULE WORKOUT PROTOCOL'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Protocol Title */}
              <div>
                <label className="cyber-label">PROTOCOL TITLE</label>
                <input
                  type="text"
                  placeholder="E.g., Morning Hypertrophy Protocol"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="cyber-input"
                  required
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="cyber-label">ACTIVATION TIME (24H FORMAT)</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="cyber-input font-display"
                  style={{ fontSize: '1.4rem', textAlign: 'center' }}
                  required
                />
              </div>

              {/* Days Selector */}
              <div>
                <label className="cyber-label">RECURRING PROTOCOL DAYS</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`cyber-btn ${isSelected ? 'cyber-btn-orange' : 'cyber-btn-ghost'} cyber-btn-sm font-tech`}
                        style={{ padding: '8px 0', fontSize: '0.8rem' }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Selector with Preview */}
              <div>
                <label className="cyber-label">SYNTHESIZED ALARM AUDIO</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={sound}
                    onChange={(e) => setSound(e.target.value)}
                    className="cyber-select"
                  >
                    {soundOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handlePreviewSound(sound)}
                    className="cyber-btn cyber-btn-cyan"
                    title="Test selected sound"
                    style={{ flexShrink: 0 }}
                  >
                    <Volume2 size={16} />
                    <span>PREVIEW</span>
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(2, 6, 23, 0.4)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}>
                <span className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  ARM PROTOCOL IMMEDIATELY
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--cyber-orange)', cursor: 'pointer' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="cyber-btn cyber-btn-orange font-display"
                style={{ padding: '12px', marginTop: '6px' }}
              >
                <Check size={18} />
                <span>{editingId ? 'COMMIT CHANGES' : 'ACTIVATE ALARM PROTOCOL'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LIVE ALARM FIRING MODAL */}
      {triggeredAlarm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255, 100, 0, 0.25)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '16px'
        }}>
          <div className="cyber-panel cyber-corners animate-heartbeat" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            background: '#020617',
            border: '3px solid var(--cyber-orange)',
            boxShadow: '0 0 50px rgba(255, 100, 0, 0.8)',
            textAlign: 'center'
          }}>
            <BellRing size={52} style={{ color: 'var(--cyber-orange)', marginBottom: '14px' }} />
            
            <div className="cyber-badge badge-orange font-mono" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
              PROTOCOL EXECUTION TIME
            </div>

            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyber-orange)', margin: '0 0 8px' }}>
              {triggeredAlarm.title}
            </h2>

            <p className="font-tech" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '20px' }}>
              Scheduled workout protocol is now active at <span className="font-mono" style={{ color: 'var(--cyber-cyan)' }}>{triggeredAlarm.time}</span>. Initialize training immediately.
            </p>

            <button
              onClick={() => {
                audio.playClick();
                setTriggeredAlarm(null);
              }}
              className="cyber-btn cyber-btn-orange font-display"
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
            >
              DISMISS & INITIATE WORKOUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
