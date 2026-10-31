import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Plus, CheckCircle, Trash2, ArrowRight, Sparkles, Target, ChevronLeft, ChevronRight } from '../icons';
import { audio } from '../../services/audioService';
import { programTracker, getDayRecommendation, detectExerciseType } from '../../services/programTrackerService';

export default function QuickWorkoutReminder({ 
  exercises = [], 
  reminders = [], 
  onSaveReminder, 
  onDeleteReminder,
  setActiveTab,
  prefillData
}) {
  // 1. Exercise Name
  const [exerciseName, setExerciseName] = useState('');

  // 2. Exercise Duration / Target Input & Unit (Reps, Sets, Seconds, Minutes, Meters, Km)
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState('minutes');

  // Program Routine Day & Progression Phase State
  const [programData, setProgramData] = useState(() => programTracker.getProgramData());

  // 3. Program Schedule (Weeks)
  const [weeksDuration, setWeeksDuration] = useState(() => String(programTracker.getProgramData().commitmentWeeks || 4));
  const [customWeeks, setCustomWeeks] = useState(6);

  useEffect(() => {
    const unsubscribe = programTracker.subscribe((updated) => {
      setProgramData(updated);
      if (updated.commitmentWeeks) {
        const cwStr = String(updated.commitmentWeeks);
        if (['1', '2', '4', '8', '12'].includes(cwStr)) {
          setWeeksDuration(cwStr);
        } else {
          setWeeksDuration('custom');
          setCustomWeeks(updated.commitmentWeeks);
        }
      }
    });
    const handleSync = (e) => {
      if (e.detail) {
        setProgramData(e.detail);
      }
    };
    window.addEventListener('dailygains_program_changed', handleSync);
    return () => {
      unsubscribe();
      window.removeEventListener('dailygains_program_changed', handleSync);
    };
  }, []);

  // 4. Target Date / Timing Selector: "Today Only" (Karong Adlawa) vs "Scheduled / Recurring"
  const [timingMode, setTimingMode] = useState('recurring'); // 'today' | 'recurring'
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().slice(0, 10));

  // 5. Reminder Time
  const [reminderTime, setReminderTime] = useState('08:00');

  // 6. Days of the Week
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Wed', 'Fri']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showScheduled, setShowScheduled] = useState(false);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const quickTimes = [
    { label: '06:30 AM', value: '06:30' },
    { label: '08:00 AM', value: '08:00' },
    { label: '12:30 PM', value: '12:30' },
    { label: '05:30 PM', value: '17:30' },
    { label: '07:00 PM', value: '19:00' }
  ];

  const commonExercises = [
    'Push-ups',
    'Squats',
    'Plank',
    'Jogging',
    'Morning Cardio',
    'Sit-ups'
  ];

  const formatUnitLabel = (unit, val = 1) => {
    switch (unit) {
      case 'reps': return val === 1 ? 'Rep' : 'Reps';
      case 'sets': return val === 1 ? 'Set' : 'Sets';
      case 'seconds': return 'Seconds';
      case 'minutes': return 'Minutes';
      case 'meters': return 'Meters';
      case 'km': return 'Kilometers (km)';
      default: return unit;
    }
  };

  // Handle Exercise Name Change with dynamic category & unit auto-switching
  const handleExerciseNameChange = (name) => {
    setExerciseName(name);

    if (name.trim()) {
      const type = detectExerciseType(name);
      const rec = getDayRecommendation(programData.currentDay, name);

      // Automatically update the target unit dropdown selector to match the workout type
      if (type === 'distance') {
        if (!['meters', 'km', 'minutes'].includes(durationUnit)) {
          setDurationUnit(rec.targetUnit);
          setDurationValue(rec.targetValue);
        }
      } else if (type === 'isometric') {
        if (!['seconds', 'minutes'].includes(durationUnit)) {
          setDurationUnit(rec.targetUnit);
          setDurationValue(rec.targetValue);
        }
      } else if (type === 'reps') {
        if (!['reps', 'sets'].includes(durationUnit)) {
          setDurationUnit(rec.targetUnit);
          setDurationValue(rec.targetValue);
        }
      }
    }
  };

  const handleSelectChip = (ex) => {
    audio.playClick();
    setExerciseName(ex);
    const rec = getDayRecommendation(programData.currentDay, ex);
    setDurationUnit(rec.targetUnit);
    setDurationValue(rec.targetValue);
  };

  const applyDayRecommendation = (rec) => {
    audio.playSuccess();
    setExerciseName(rec.autoFillPayload.exercise_name);
    setDurationValue(rec.autoFillPayload.duration_value);
    setDurationUnit(rec.autoFillPayload.duration_unit);
    setFeedback({
      type: 'success',
      text: `Applied Day ${programData.currentDay} ${rec.exerciseName} Guide: ${rec.autoFillPayload.duration_value} ${formatUnitLabel(rec.autoFillPayload.duration_unit, rec.autoFillPayload.duration_value)} (${rec.autoFillPayload.prescription})`
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const format12Hour = (time24) => {
    if (!time24) return '08:00 AM';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const toggleDay = (day) => {
    audio.playClick();
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const selectPresetDays = (preset) => {
    audio.playClick();
    if (preset === 'weekdays') {
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    } else if (preset === 'all') {
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    } else if (preset === 'mwf') {
      setSelectedDays(['Mon', 'Wed', 'Fri']);
    }
  };

  const handleSaveAndSet = async (e) => {
    if (e) e.preventDefault();
    const cleanName = exerciseName.trim();
    if (!cleanName) {
      setFeedback({ type: 'error', text: 'Please enter an exercise or workout title.' });
      return;
    }

    setIsSubmitting(true);
    audio.playSuccess();

    const finalWeeks = weeksDuration === 'custom' ? Math.max(1, Number(customWeeks) || 1) : Number(weeksDuration);
    const isToday = timingMode === 'today';

    const payload = {
      exercise_name: cleanName,
      duration_value: Math.max(1, Number(durationValue) || 1),
      duration_unit: durationUnit,
      weeks_duration: isToday ? 1 : finalWeeks,
      is_today_only: isToday ? 1 : 0,
      target_date: isToday ? new Date().toISOString().slice(0, 10) : targetDate,
      reminder_time: reminderTime,
      days_of_week: isToday 
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()] 
        : selectedDays.join(','),
      is_active: 1
    };

    try {
      if (onSaveReminder) {
        await onSaveReminder(payload);
      }
      setFeedback({
        type: 'success',
        text: `Reminder set: "${cleanName}" (${payload.duration_value} ${payload.duration_unit}) at ${format12Hour(reminderTime)}${isToday ? ' [Today Only]' : ` for ${payload.weeks_duration} Weeks`}`
      });
      setExerciseName('');
    } catch {
      setFeedback({ type: 'error', text: 'Failed to save reminder. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Handle prefill data from AI recommendation engine with progressive adaptation
  useEffect(() => {
    if (prefillData && prefillData.name) {
      setExerciseName(prefillData.name);
      if (prefillData.durationValue) {
        setDurationValue(prefillData.durationValue);
      }
      if (prefillData.durationUnit) {
        setDurationUnit(prefillData.durationUnit);
      }
      if (prefillData.days && Array.isArray(prefillData.days)) {
        setSelectedDays(prefillData.days);
      }
      if (prefillData.reminderTime) {
        setReminderTime(prefillData.reminderTime);
      }
      if (prefillData.weeksDuration) {
        setWeeksDuration(String(prefillData.weeksDuration));
      }
      setFeedback({
        type: 'success',
        text: `Adapted Recommendation "${prefillData.name}" (${prefillData.prescription || ''}) loaded for Day ${programData.currentDay}!`
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  }, [prefillData, programData.currentDay]);

  return (
    <div id="quick-reminder-card" className="cyber-panel" style={{ padding: '22px 24px' }}>
      {/* Header */}
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
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--accent-blue-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
            flexShrink: 0
          }}>
            <Bell size={20} />
          </div>
          <div>
            <h3 style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0
            }}>
              Quick Workout Reminder
            </h3>
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              margin: '2px 0 0'
            }}>
              Advanced scheduling with target duration and program commitment
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audio.playClick();
            setShowScheduled(!showScheduled);
          }}
          style={{
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {showScheduled ? 'Hide Reminders' : `Scheduled (${reminders.length})`}
        </button>
      </div>

      {/* Program Routine Progression Tracker, Interactive Day Input & Dynamic Target Recommendations */}
      {(() => {
        const dayRec = getDayRecommendation(programData.currentDay, exerciseName);
        return (
          <div style={{
            background: 'var(--bg-input)',
            border: `1px solid ${programData.phase.borderColor}`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Top Row: Subtle Status Badge & Interactive Routine Day Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {/* Subtle Status Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '9999px',
                background: programData.phase.bgColor,
                border: `1px solid ${programData.phase.borderColor}`,
                color: programData.phase.color,
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                <Calendar size={12} />
                <span>{programData.phase.statusBadge}</span>
              </div>

              {/* 1. INTERACTIVE PROGRAM DAY INPUT: "Routine Day: [ 1 ] of 28" */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <label style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Target size={13} style={{ color: programData.phase.color }} />
                  <span>Routine Day:</span>
                </label>

                {/* Editable Day Number Box */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--bg-card)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  border: `1px solid ${programData.phase.borderColor}`,
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Day</span>
                  <input
                    type="number"
                    min="1"
                    max={programData.totalDays || 365}
                    value={programData.currentDay}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      programTracker.setCurrentDay(val);
                    }}
                    aria-label="Routine Day Number Input"
                    className="cyber-input"
                    style={{
                      width: '54px',
                      padding: '2px 6px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      color: 'var(--accent-cyan)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--accent-cyan)',
                      borderRadius: '6px'
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    of {programData.totalDays}
                  </span>
                </div>

                {/* Steppers: [◀], [▶], [Reset] */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'var(--bg-card)',
                  padding: '2px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    title="Previous Routine Day"
                    onClick={() => {
                      audio.playClick();
                      programTracker.setCurrentDay(Math.max(1, programData.currentDay - 1));
                    }}
                    disabled={programData.currentDay <= 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: programData.currentDay <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                      cursor: programData.currentDay <= 1 ? 'not-allowed' : 'pointer',
                      padding: '2px 5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    title="Next Routine Day"
                    onClick={() => {
                      audio.playClick();
                      programTracker.setCurrentDay(programData.currentDay + 1);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                  <button
                    type="button"
                    title="Reset to Day 1"
                    onClick={() => {
                      audio.playClick();
                      programTracker.resetToDayOne(programData.commitmentWeeks);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      fontWeight: 600
                    }}
                  >
                    Reset
                  </button>
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: programData.phase.color
                }}>
                  {programData.phase.routineBadge}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{
              height: '6px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${programData.progressPercent}%`,
                background: `linear-gradient(90deg, #06b6d4 0%, ${programData.phase.color} 100%)`,
                borderRadius: '9999px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.68rem',
              color: 'var(--text-muted)'
            }}>
              <span>Commitment: {programData.commitmentWeeks} Weeks ({programData.totalDays} Days) • Started {programData.startDate}</span>
              <span style={{ fontWeight: 600, color: programData.phase.color }}>{programData.progressPercent}% Completed</span>
            </div>

            {/* 2. DYNAMIC DAY-BASED TARGET & REPS RECOMMENDATIONS & QUICK AUTO-FILL ACTION */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.07) 100%)',
              border: `1px solid ${programData.phase.borderColor}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(6, 182, 212, 0.18)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  Day {programData.currentDay} Target
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  {dayRec.recommendationSummary}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: dayRec.intensityColor + '18',
                  color: dayRec.intensityColor,
                  border: `1px solid ${dayRec.intensityColor}35`
                }}>
                  {dayRec.intensityBadge}
                </span>
              </div>

              {/* Quick Auto-Fill Action: Subtle Click Label */}
              <button
                type="button"
                onClick={() => applyDayRecommendation(dayRec)}
                style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-cyan)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)';
                  e.currentTarget.style.color = 'var(--accent-cyan)';
                }}
                title="Auto-fill exercise name and duration/reps with this recommendation"
              >
                <span>{dayRec.quickFillText}</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Main Input Form */}
      <form onSubmit={handleSaveAndSet} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* 1. Exercise Name Input with Suggestions */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.84rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: '6px'
          }}>
            Exercise Name / Workout Title
          </label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => handleExerciseNameChange(e.target.value)}
            placeholder="e.g., Push-ups, Squats, Plank, Jogging, Morning Cardio"
            className="cyber-input"
            required
          />

          {/* Quick-select chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Quick Select:</span>

            {/* Dynamic Day Recommendation Quick Chip */}
            <button
              type="button"
              onClick={() => {
                const currentDayRec = getDayRecommendation(programData.currentDay, exerciseName);
                applyDayRecommendation(currentDayRec);
              }}
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                fontSize: '0.74rem',
                padding: '3px 10px',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              title="Apply Day Target"
            >
              <span>★ Day {programData.currentDay} Target ({getDayRecommendation(programData.currentDay, exerciseName).exerciseName})</span>
            </button>

            {commonExercises.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => handleSelectChip(ex)}
                style={{
                  background: exerciseName === ex ? 'var(--accent-blue-light)' : 'var(--bg-input)',
                  border: `1px solid ${exerciseName === ex ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  color: exerciseName === ex ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.15s ease'
                }}
              >
                + {ex}
              </button>
            ))}
          </div>

          {/* Redesigned High-Contrast Interactive Volume Guide Card */}
          {(() => {
            const rec = getDayRecommendation(programData.currentDay, exerciseName);
            return (
              <div
                role="button"
                tabIndex={0}
                onClick={() => applyDayRecommendation(rec)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    applyDayRecommendation(rec);
                  }
                }}
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(8, 47, 73, 0.45)', // stylish semi-transparent cyan-950/45 card
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(8, 47, 73, 0.7)';
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.22)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(8, 47, 73, 0.45)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(6, 182, 212, 0.08)';
                }}
                title="Click anywhere on this Volume Guide to auto-fill targets into the form"
              >
                {/* Left Content with High-Contrast Text & Clear Solid Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 280px' }}>
                  {/* Solid Accent Pop-out Badge */}
                  <span style={{
                    background: '#06b6d4', // solid cyan-500
                    color: '#0f172a', // dark slate-900 for high-contrast bold readability
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    letterSpacing: '0.01em',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(6, 182, 212, 0.3)'
                  }}>
                    <span>{rec.guideBadgeLabel || `💡 Day ${programData.currentDay} Volume Guide:`}</span>
                  </span>

                  {/* High-Contrast Description: Bright White & Glowing Cyan */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      color: '#f8fafc', // bright white text
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      letterSpacing: '-0.01em'
                    }}>
                      {rec.recommendationSummary}
                    </span>

                    <span style={{
                      color: '#38bdf8', // glowing cyan text
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}>
                      • {rec.rationale}
                    </span>
                  </div>
                </div>

                {/* Right Interactive Hint */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  color: '#38bdf8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  <span>⚡ Click to Auto-Fill</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 2. Duration / Target + Program Schedule (Weeks) (2 columns) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px'
        }}>
          {/* Exercise Duration / Target Input & Unit */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}>
              Exercise Target / Duration
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="999"
                value={durationValue}
                onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
                className="cyber-input"
                style={{ flex: 1, fontWeight: 600 }}
                required
              />

              {/* Unit Toggle / Dropdown: Reps, Sets, Seconds, Minutes, Meters, Km */}
              <select
                value={durationUnit}
                onChange={(e) => {
                  audio.playClick();
                  setDurationUnit(e.target.value);
                }}
                className="cyber-select"
                style={{
                  minWidth: '135px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--accent-cyan)'
                }}
              >
                <optgroup label="Repetitions">
                  <option value="reps">Reps (Repetitions)</option>
                  <option value="sets">Sets</option>
                </optgroup>
                <optgroup label="Duration / Time">
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                </optgroup>
                <optgroup label="Distance / Cardio">
                  <option value="meters">Meters (m)</option>
                  <option value="km">Kilometers (km)</option>
                </optgroup>
              </select>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Target: {durationValue} {formatUnitLabel(durationUnit, durationValue)} per session
            </span>
          </div>

          {/* Program Schedule (Weeks) */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}>
              Program Commitment
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={weeksDuration}
                onChange={(e) => {
                  audio.playClick();
                  const val = e.target.value;
                  setWeeksDuration(val);
                  if (val !== 'custom') {
                    programTracker.setCommitmentWeeks(Number(val));
                  } else {
                    programTracker.setCommitmentWeeks(Number(customWeeks) || 6);
                  }
                }}
                className="cyber-select"
                style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="1">1 Week Challenge (7 Days)</option>
                <option value="2">2 Weeks Commitment (14 Days)</option>
                <option value="4">4 Weeks Routine (28 Days)</option>
                <option value="8">8 Weeks Program (56 Days)</option>
                <option value="12">12 Weeks Transformation (84 Days)</option>
                <option value="custom">Custom Weeks...</option>
              </select>

              {weeksDuration === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={customWeeks}
                    onChange={(e) => {
                      const num = Math.max(1, Number(e.target.value) || 1);
                      setCustomWeeks(num);
                      programTracker.setCommitmentWeeks(num);
                    }}
                    className="cyber-input"
                    style={{ width: '70px', fontWeight: 600 }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Wks</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {weeksDuration === 'custom' ? `${customWeeks} Weeks` : `${weeksDuration} Weeks`} routine commitment
            </span>
          </div>
        </div>

        {/* 3. Target Date / Timing Selector: "Today Only" (Karong Adlawa) vs "Scheduled / Recurring" */}
        <div style={{
          background: 'var(--bg-input)',
          padding: '14px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: timingMode === 'recurring' ? '12px' : '0'
          }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Execution Timing
            </span>

            {/* Segmented Radio / Pill Toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-card)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setTimingMode('today');
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: timingMode === 'today' ? 'var(--accent-cyan)' : 'transparent',
                  color: timingMode === 'today' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                Today Only (Karong Adlawa)
              </button>
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setTimingMode('recurring');
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: timingMode === 'recurring' ? 'var(--accent-blue)' : 'transparent',
                  color: timingMode === 'recurring' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                Scheduled / Recurring
              </button>
            </div>
          </div>

          {/* Date Picker Field if "Scheduled / Recurring" is active */}
          {timingMode === 'recurring' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, minWidth: '100px' }}>
                Start / Target Date:
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  if (e.target.value) {
                    programTracker.setStartDate(e.target.value);
                  }
                }}
                className="cyber-input"
                style={{ maxWidth: '200px', padding: '7px 12px', fontSize: '0.86rem' }}
              />
            </div>
          ) : (
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--accent-cyan)',
              fontWeight: 500,
              marginTop: '4px'
            }}>
              Scheduled to run today only ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})
            </div>
          )}
        </div>

        {/* 4. Reminder Time (Time Picker & Quick Presets) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'start'
        }}>
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}>
              <Clock size={15} style={{ color: 'var(--accent-blue)' }} />
              <span>Reminder Time</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="cyber-input"
                style={{ flex: 1, fontWeight: 600 }}
                required
              />
              <span style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--accent-blue)',
                background: 'var(--accent-blue-light)',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                whiteSpace: 'nowrap'
              }}>
                {format12Hour(reminderTime)}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Preset Times
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {quickTimes.map((qt) => (
                <button
                  type="button"
                  key={qt.value}
                  onClick={() => {
                    audio.playClick();
                    setReminderTime(qt.value);
                  }}
                  style={{
                    background: reminderTime === qt.value ? 'var(--accent-blue-light)' : 'var(--bg-input)',
                    border: `1px solid ${reminderTime === qt.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    color: reminderTime === qt.value ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    padding: '5px 9px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Days of the Week Selector (Pills) */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)'
            }}>
              <Calendar size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>Days of the Week {timingMode === 'today' ? '(Auto-set to Today)' : ''}</span>
            </label>

            {timingMode === 'recurring' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => selectPresetDays('mwf')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Mon/Wed/Fri
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                <button
                  type="button"
                  onClick={() => selectPresetDays('weekdays')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Weekdays
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                <button
                  type="button"
                  onClick={() => selectPresetDays('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Everyday
                </button>
              </div>
            )}
          </div>

          {/* Pill-Style Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px'
          }}>
            {daysOfWeek.map((day) => {
              const active = timingMode === 'today'
                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()] === day
                : selectedDays.includes(day);

              return (
                <button
                  type="button"
                  key={day}
                  disabled={timingMode === 'today'}
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '8px 2px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: timingMode === 'today' ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    background: active ? 'var(--accent-cyan)' : 'var(--bg-input)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    boxShadow: active ? '0 2px 8px rgba(6, 182, 212, 0.3)' : 'none',
                    opacity: timingMode === 'today' && !active ? 0.45 : 1
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Feedback Toast */}
        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {feedback.type === 'success' && <CheckCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 6. "Save & Set Reminder" Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="cyber-btn cyber-btn-cyan"
            style={{
              padding: '11px 24px',
              fontSize: '0.9rem',
              borderRadius: '10px',
              fontWeight: 600
            }}
          >
            <Plus size={16} />
            <span>{isSubmitting ? 'Saving Reminder...' : 'Save & Set Reminder'}</span>
          </button>
        </div>
      </form>

      {/* Scheduled Reminders Drawer */}
      {showScheduled && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Active Workout Schedules ({reminders.length})
            </span>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setActiveTab('alarms');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View Full Schedule</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {reminders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', margin: '14px 0' }}>
              No reminders scheduled yet. Configure a routine above!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {reminders.map((r) => {
                const durVal = r.duration_value || 30;
                const durUnit = r.duration_unit || 'minutes';
                const isToday = Boolean(r.is_today_only);
                const weeks = r.weeks_duration || 4;

                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: 'var(--accent-blue)',
                        background: 'var(--accent-blue-light)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        {format12Hour(r.reminder_time || r.time)}
                      </span>

                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {r.exercise_name || r.title}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'var(--accent-cyan-light)',
                            color: 'var(--accent-cyan)',
                            fontWeight: 600
                          }}>
                            {durVal} {formatUnitLabel(durUnit, durVal)}
                          </span>
                          <span>•</span>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isToday ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: isToday ? '#f59e0b' : 'var(--accent-blue)',
                            fontWeight: 600
                          }}>
                            {isToday ? 'Today Only' : `${weeks} Weeks Program`}
                          </span>
                          <span>•</span>
                          <span>{r.days_of_week || r.days}</span>
                        </div>
                      </div>
                    </div>

                    {onDeleteReminder && (
                      <button
                        type="button"
                        onClick={() => {
                          audio.playClick();
                          onDeleteReminder(r.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-red)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                        title="Delete reminder"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
