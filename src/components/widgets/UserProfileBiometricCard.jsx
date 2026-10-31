import React, { useState, useEffect } from 'react';
import { 
  User, 
  Scale, 
  Edit, 
  CheckCircle, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Play, 
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Target
} from '../icons';
import { audio } from '../../services/audioService';
import { wger } from '../../services/wgerService';
import { programTracker } from '../../services/programTrackerService';

export default function UserProfileBiometricCard({
  userProfile,
  userMetrics,
  onSaveMetrics,
  onSaveProfile,
  onAddToReminder,
  onStartWorkout
}) {
  // Unit Mode
  const [unitMode, setUnitMode] = useState('metric');

  // Profile & Metric States
  const [userName, setUserName] = useState(userProfile?.user_name || 'John Melrow');
  const [age, setAge] = useState(userMetrics?.age || userProfile?.age || 26);
  const [heightCm, setHeightCm] = useState(userMetrics?.height_cm || userMetrics?.height || 175);
  const [weightKg, setWeightKg] = useState(userMetrics?.weight_kg || userMetrics?.weight || 72);

  // Imperial conversions
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(9);
  const [weightLbs, setWeightLbs] = useState(158.7);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Wger API Recommendations State
  const [wgerCatalog, setWgerCatalog] = useState([]);
  const [isLoadingWger, setIsLoadingWger] = useState(false);
  const [apiSource, setApiSource] = useState('Wger Core');
  const [addedNotice, setAddedNotice] = useState(null);

  // Program Routine Day & Progressive Intensity State
  const [programData, setProgramData] = useState(() => programTracker.getProgramData());

  useEffect(() => {
    const unsubscribe = programTracker.subscribe((updated) => {
      setProgramData(updated);
    });
    const handleSync = (e) => {
      if (e.detail) setProgramData(e.detail);
    };
    window.addEventListener('dailygains_program_changed', handleSync);
    return () => {
      unsubscribe();
      window.removeEventListener('dailygains_program_changed', handleSync);
    };
  }, []);

  // Sync with prop changes
  useEffect(() => {
    if (userProfile?.user_name) {
      setUserName(userProfile.user_name);
    }
    const currentAge = userMetrics?.age || userProfile?.age || 26;
    setAge(currentAge);

    if (userMetrics?.height_cm || userMetrics?.height) {
      const cm = parseFloat(userMetrics.height_cm || userMetrics.height) || 175;
      setHeightCm(cm);
      const totalInches = Math.round(cm / 2.54);
      setHeightFt(Math.floor(totalInches / 12));
      setHeightIn(totalInches % 12);
    }
    if (userMetrics?.weight_kg || userMetrics?.weight) {
      const kg = parseFloat(userMetrics.weight_kg || userMetrics.weight) || 72;
      setWeightKg(kg);
      setWeightLbs(Math.round(kg * 2.20462 * 10) / 10);
    }
  }, [userProfile, userMetrics]);

  // Fetch exercises from Wger API on mount
  useEffect(() => {
    let isMounted = true;
    const loadWger = async () => {
      setIsLoadingWger(true);
      try {
        const data = await wger.fetchExercises();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setWgerCatalog(data);
          setApiSource(wger.cachedExercises ? 'Wger API (Live)' : 'Wger Core');
        }
      } catch (err) {
        if (isMounted) {
          setApiSource('Wger Fallback');
        }
      } finally {
        if (isMounted) {
          setIsLoadingWger(false);
        }
      }
    };
    loadWger();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Imperial unit calculations
  const handleImperialHeightChange = (ft, inc) => {
    const feet = Math.max(1, Math.min(8, Number(ft) || 0));
    const inches = Math.max(0, Math.min(11, Number(inc) || 0));
    setHeightFt(feet);
    setHeightIn(inches);
    const cm = Math.round(((feet * 12) + inches) * 2.54);
    setHeightCm(cm);
  };

  const handleImperialWeightChange = (lbsVal) => {
    const lbs = Math.max(40, Math.min(1000, Number(lbsVal) || 0));
    setWeightLbs(lbs);
    const kg = Math.round((lbs / 2.20462) * 10) / 10;
    setWeightKg(kg);
  };

  // Live BMI calculation
  const heightM = Math.max(0.5, heightCm / 100);
  const bmiValue = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  // Determine BMI category & badge color
  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) {
      return {
        label: 'Underweight',
        color: '#06b6d4',
        bgColor: 'rgba(6, 182, 212, 0.12)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        percent: Math.min(100, Math.max(5, ((bmi - 12) / 6.5) * 25))
      };
    } else if (bmi < 25.0) {
      return {
        label: 'Normal Weight',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        percent: 25 + Math.min(25, Math.max(0, ((bmi - 18.5) / 6.4) * 25))
      };
    } else if (bmi < 30.0) {
      return {
        label: 'Overweight',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        percent: 50 + Math.min(25, Math.max(0, ((bmi - 25.0) / 4.9) * 25))
      };
    } else {
      return {
        label: 'Obese',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        percent: 75 + Math.min(25, Math.max(0, ((bmi - 30.0) / 10.0) * 25))
      };
    }
  };

  const bmiStatus = getBmiCategory(bmiValue);

  // Compute dynamic personalized recommendations based on biometrics, Wger catalog & program routine progression
  const recommendation = wger.getPersonalizedRecommendations(wgerCatalog, {
    bmi: bmiValue,
    age: age,
    height: heightCm,
    weight: weightKg,
    programDay: programData.currentDay,
    commitmentWeeks: programData.commitmentWeeks
  });

  // User Initials for Avatar badge
  const getInitials = (name) => {
    if (!name) return 'DG';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Save changes
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    audio.playClick();
    setIsSaving(true);

    const metricsPayload = {
      age: Number(age) || 25,
      height_cm: Number(heightCm) || 175,
      weight_kg: Number(weightKg) || 70,
      bmi_value: bmiValue,
      bmi_status: bmiStatus.label,
      height: Number(heightCm) || 175,
      weight: Number(weightKg) || 70,
      bmi: bmiValue
    };

    const profilePayload = {
      user_name: userName.trim() || 'Athlete',
      age: Number(age) || 25,
      fitness_goal: userProfile?.fitness_goal || 'Muscle Gain',
      preferred_unit: unitMode
    };

    try {
      if (onSaveMetrics) {
        await onSaveMetrics(metricsPayload);
      }
      if (onSaveProfile) {
        await onSaveProfile(profilePayload);
      }
      audio.playSuccess();
      setSaveFeedback('Profile & biometrics updated successfully!');
      setIsEditModalOpen(false);
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err) {
      console.error('Error saving profile and metrics:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Action: Add exercise to Quick Workout Reminder with adapted progressive duration & prescription
  const handleAddToReminderClick = (exercise) => {
    audio.playClick();
    if (onAddToReminder) {
      onAddToReminder({
        name: exercise.name,
        durationValue: exercise.durationValue || 20,
        durationUnit: exercise.durationUnit || 'minutes',
        days: exercise.days || ['Mon', 'Wed', 'Fri'],
        reminderTime: '08:00',
        prescription: exercise.prescription || '2-3 Sets × 8-10 Reps',
        programDay: programData.currentDay,
        weeksDuration: programData.commitmentWeeks
      });
    }

    setAddedNotice(`"${exercise.name}" (${exercise.prescription}) loaded into Quick Workout Reminder!`);
    setTimeout(() => setAddedNotice(null), 4000);

    const targetElement = document.getElementById('quick-reminder-card');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Quick Action: Start Workout Set directly
  const handleStartWorkoutClick = (exercise) => {
    audio.playClick();
    if (onStartWorkout) {
      onStartWorkout({
        name: exercise.name,
        category: exercise.category || 'General',
        target_muscle: exercise.muscles || exercise.category || 'Full Body',
        equipment: exercise.equipment || 'Bodyweight'
      });
    }
  };

  return (
    <div className="cyber-panel" style={{
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      position: 'relative'
    }}>
      {/* 1. Profile Header with Avatar & Edit Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar Icon / Cybertech Badge */}
          <div style={{
            position: 'relative',
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
            border: '2px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.25)',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--accent-cyan)',
              letterSpacing: '0.05em'
            }}>
              {getInitials(userName)}
            </span>
            {/* Online Status Dot */}
            <span style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid var(--bg-card)'
            }} />
          </div>

          {/* Name & Athlete Goal Subtitle */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                {userName}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'var(--accent-cyan-light)',
                color: 'var(--accent-cyan)'
              }}>
                {age} YRS
              </span>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '2px'
            }}>
              <span>{userProfile?.fitness_goal || 'Muscle Gain'} Protocol</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-blue)' }}>Daily Athlete</span>
            </div>
          </div>
        </div>

        {/* Quick Edit Profile Action Button */}
        <button
          onClick={() => {
            audio.playClick();
            setIsEditModalOpen(true);
          }}
          className="cyber-btn cyber-btn-ghost cyber-btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            padding: '7px 14px'
          }}
          title="Edit Name, Age, Weight, and Height"
        >
          <Edit size={14} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Save Feedback Toast */}
      {saveFeedback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.82rem',
          fontWeight: 600,
          animation: 'fadeIn 0.25s ease'
        }}>
          <CheckCircle size={15} />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* 2. Integrated Metrics Grid Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px'
      }}>
        {/* Weight Box */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '12px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Weight
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {weightKg} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>
            {weightLbs} lbs
          </div>
        </div>

        {/* Height Box */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '12px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Height
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {heightCm} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>cm</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>
            {heightFt}&apos;{heightIn}&quot;
          </div>
        </div>

        {/* Age Box */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '12px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Age
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {age} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>yrs</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>
            Years Old
          </div>
        </div>

        {/* Calculated BMI Box */}
        <div style={{
          background: bmiStatus.bgColor,
          border: `1px solid ${bmiStatus.borderColor}`,
          borderRadius: '12px',
          padding: '12px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: bmiStatus.color, textTransform: 'uppercase' }}>
            BMI Score
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: bmiStatus.color, marginTop: '1px' }}>
            {bmiValue}
          </div>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: bmiStatus.color,
            marginTop: '1px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {bmiStatus.label}
          </div>
        </div>
      </div>

      {/* 3. Visual BMI Gauge & Scale Indicator */}
      <div style={{
        background: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '14px 16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '0.78rem'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Biometric Health Index
          </span>
          <span style={{
            fontWeight: 700,
            color: bmiStatus.color,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: bmiStatus.color
            }} />
            {bmiStatus.label} ({bmiValue})
          </span>
        </div>

        {/* Multi-segmented Gauge Bar */}
        <div style={{
          position: 'relative',
          height: '8px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex'
        }}>
          {/* Underweight zone (<18.5) */}
          <div style={{ width: '25%', background: '#06b6d4', opacity: 0.6 }} title="Underweight (< 18.5)" />
          {/* Normal zone (18.5 - 24.9) */}
          <div style={{ width: '25%', background: '#10b981', opacity: 0.8 }} title="Normal Weight (18.5 - 24.9)" />
          {/* Overweight zone (25.0 - 29.9) */}
          <div style={{ width: '25%', background: '#f59e0b', opacity: 0.6 }} title="Overweight (25.0 - 29.9)" />
          {/* Obese zone (>=30.0) */}
          <div style={{ width: '25%', background: '#ef4444', opacity: 0.6 }} title="Obese (>= 30.0)" />
        </div>

        {/* Indicator Legend Labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          marginTop: '6px',
          fontWeight: 500
        }}>
          <span>&lt; 18.5 Under</span>
          <span>18.5 - 24.9 Normal</span>
          <span>25.0 - 29.9 Over</span>
          <span>&ge; 30.0 Obese</span>
        </div>
      </div>

      {/* 4. NESTED PERSONALIZED RECOMMENDATIONS SECTION (Wger API Driven) */}
      <div style={{
        marginTop: '6px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--accent-cyan)'
            }}>
              <Sparkles size={17} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Personalized Recommendations
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  Wger API
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: recommendation.themeColor,
                  border: `1px solid ${recommendation.themeColor}40`
                }}>
                  {recommendation.protocolBadge}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tailored for <strong style={{ color: 'var(--text-main)' }}>{userName}</strong> ({bmiStatus.label} • Age {age})
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Activity size={13} style={{ color: recommendation.themeColor }} />
            <span>{recommendation.protocolTitle}</span>
          </div>
        </div>

        {/* Program Routine Day Progression Tracker & Subtle Status Badge */}
        <div style={{
          background: 'var(--bg-input)',
          border: `1px solid ${programData.phase.borderColor}`,
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Top Row: Subtle Status Badge & Routine Day Visual Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
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

            {/* Routine Day / Progression Phase & Interactive Day Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                background: 'var(--bg-card)',
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <Target size={12} style={{ color: programData.phase.color }} />
                <span>Day</span>
                <input
                  type="number"
                  min="1"
                  max={programData.totalDays || 365}
                  value={programData.currentDay}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    programTracker.setCurrentDay(val);
                  }}
                  className="cyber-input"
                  style={{
                    width: '50px',
                    padding: '1px 4px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    color: 'var(--accent-cyan)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: '6px'
                  }}
                />
                <span>of {programData.totalDays}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({programData.commitmentWeeks} Wks)</span>
              </div>

              {/* Interactive Day Stepper [- Day +] */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                padding: '2px 4px',
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  title="Previous Day"
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
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  title="Next Day"
                  onClick={() => {
                    audio.playClick();
                    programTracker.setCurrentDay(programData.currentDay + 1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    padding: '2px 4px',
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
                    padding: '2px 5px',
                    fontSize: '0.66rem',
                    fontWeight: 600
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Phase Badge & Progress Bar */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              fontSize: '0.74rem'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                color: programData.phase.color
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: programData.phase.color
                }} />
                {programData.phase.routineBadge}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                {programData.progressPercent}% Cycle Complete
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div style={{
              height: '7px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${programData.progressPercent}%`,
                background: `linear-gradient(90deg, #06b6d4 0%, ${programData.phase.color} 100%)`,
                borderRadius: '9999px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Phase Milestone Ticks */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.64rem',
              color: 'var(--text-dim)',
              marginTop: '4px',
              fontWeight: 500
            }}>
              <span style={{ color: programData.currentDay <= 7 ? programData.phase.color : 'inherit' }}>
                Days 1-7 Foundation
              </span>
              <span style={{ color: programData.currentDay >= 8 && programData.currentDay <= 21 ? programData.phase.color : 'inherit' }}>
                Days 8-21 Building
              </span>
              <span style={{ color: programData.currentDay >= 22 ? programData.phase.color : 'inherit' }}>
                Days 22+ Peak
              </span>
            </div>
          </div>

          {/* Progressive Intensity Adaptation Mode Indicator Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'var(--bg-card-subtle)',
            border: `1px solid ${programData.phase.borderColor}`,
            fontSize: '0.74rem'
          }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: programData.phase.bgColor,
              color: programData.phase.color,
              border: `1px solid ${programData.phase.borderColor}`
            }}>
              {programData.phase.modeBadge}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {programData.phase.intensityDesc}
            </span>
          </div>
        </div>

        {/* Biometric Prescription Rationale Banner */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          border: `1px solid ${recommendation.themeColor}30`,
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '4px',
            height: '24px',
            borderRadius: '4px',
            background: recommendation.themeColor,
            flexShrink: 0
          }} />
          <div>
            <strong style={{ color: recommendation.themeColor, marginRight: '5px' }}>Prescription Rationale:</strong>
            {recommendation.protocolSummary}
            {age >= 50 && (
              <span style={{ display: 'block', marginTop: '2px', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                • Age 50+ Priority: Emphasizing gentle joint articulation, zero-impact spinal loads, and postural alignment.
              </span>
            )}
          </div>
        </div>

        {/* Quick Added Notice Feedback Toast */}
        {addedNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.8rem',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease'
          }}>
            <CheckCircle size={14} />
            <span>{addedNotice}</span>
          </div>
        )}

        {/* 4 Exercise Recommendation Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px'
        }}>
          {recommendation.exercises.map((ex) => (
            <div
              key={ex.id}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = recommendation.themeColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Exercise Details */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <h4 style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    margin: 0,
                    lineHeight: 1.3
                  }}>
                    {ex.name}
                  </h4>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'var(--accent-cyan-light)',
                    color: 'var(--accent-cyan)',
                    whiteSpace: 'nowrap'
                  }}>
                    {ex.category}
                  </span>
                </div>

                {/* Target Muscle Group & Equipment */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: 'var(--accent-blue-light)',
                    color: 'var(--accent-blue)'
                  }}>
                    {ex.muscles}
                  </span>
                  {ex.equipment && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)'
                    }}>
                      {ex.equipment}
                    </span>
                  )}
                </div>

                {/* Quick Instructions / Description summary */}
                <p style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  margin: '0 0 8px',
                  maxHeight: '56px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {ex.description}
                </p>

                {/* Progressive Intensity Prescription & Target Duration */}
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {ex.prescription}
                    </span>
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: (ex.intensityColor || '#06b6d4') + '18',
                      color: ex.intensityColor || '#06b6d4',
                      border: `1px solid ${(ex.intensityColor || '#06b6d4')}35`
                    }}>
                      {ex.intensityBadge || 'Adaptive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span>Target: {ex.durationValue} {ex.durationUnit}</span>
                    <span>{ex.intensityStage || 'Foundation'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: '6px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => handleAddToReminderClick(ex)}
                  className="cyber-btn cyber-btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 600
                  }}
                  title="Populate Quick Workout Reminder with this exercise"
                >
                  <Clock size={12} style={{ color: 'var(--accent-cyan)' }} />
                  <span>+ Reminder</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartWorkoutClick(ex)}
                  className="cyber-btn cyber-btn-cyan"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 600
                  }}
                  title="Start and record this exercise now"
                >
                  <Play size={12} />
                  <span>Start Set</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Edit Profile & Biometrics Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="cyber-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '24px 26px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
            border: '1px solid var(--accent-cyan)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Update Profile & Biometrics
                </h3>
              </div>

              {/* Unit Toggle */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    setUnitMode('metric');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: unitMode === 'metric' ? 'var(--accent-cyan)' : 'transparent',
                    color: unitMode === 'metric' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    setUnitMode('imperial');
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: unitMode === 'imperial' ? 'var(--accent-cyan)' : 'transparent',
                    color: unitMode === 'imperial' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Imperial
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name / Athlete Handle
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. John Melrow"
                  className="cyber-input"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}
                  required
                />
              </div>

              {/* Age & Height */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="110"
                    value={age}
                    onChange={(e) => setAge(Math.max(10, Math.min(110, Number(e.target.value) || 25)))}
                    className="cyber-input"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                {unitMode === 'metric' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="80"
                      max="250"
                      value={heightCm}
                      onChange={(e) => {
                        const cm = Number(e.target.value) || 170;
                        setHeightCm(cm);
                        const totalInches = Math.round(cm / 2.54);
                        setHeightFt(Math.floor(totalInches / 12));
                        setHeightIn(totalInches % 12);
                      }}
                      className="cyber-input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Height (ft & in)
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        min="3"
                        max="8"
                        value={heightFt}
                        onChange={(e) => handleImperialHeightChange(e.target.value, heightIn)}
                        className="cyber-input"
                        style={{ width: '50%', padding: '9px 8px', fontSize: '0.9rem' }}
                        placeholder="ft"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={heightIn}
                        onChange={(e) => handleImperialHeightChange(heightFt, e.target.value)}
                        className="cyber-input"
                        style={{ width: '50%', padding: '9px 8px', fontSize: '0.9rem' }}
                        placeholder="in"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Weight ({unitMode === 'metric' ? 'Kilograms' : 'Pounds'})
                </label>
                {unitMode === 'metric' ? (
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="300"
                    value={weightKg}
                    onChange={(e) => {
                      const kg = Number(e.target.value) || 70;
                      setWeightKg(kg);
                      setWeightLbs(Math.round(kg * 2.20462 * 10) / 10);
                    }}
                    className="cyber-input"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}
                    required
                  />
                ) : (
                  <input
                    type="number"
                    step="1"
                    min="60"
                    max="600"
                    value={weightLbs}
                    onChange={(e) => handleImperialWeightChange(e.target.value)}
                    className="cyber-input"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}
                    required
                  />
                )}
              </div>

              {/* Real-time Recalculated Live Preview Badge */}
              <div style={{
                background: bmiStatus.bgColor,
                border: `1px solid ${bmiStatus.borderColor}`,
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Recalculated BMI Preview:
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: bmiStatus.color }}>
                  {bmiValue} — {bmiStatus.label}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    setIsEditModalOpen(false);
                  }}
                  className="cyber-btn cyber-btn-ghost"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cyber-btn cyber-btn-cyan"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  {isSaving ? <RotateCcw size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{isSaving ? 'Updating...' : 'Save Profile & Metrics'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
