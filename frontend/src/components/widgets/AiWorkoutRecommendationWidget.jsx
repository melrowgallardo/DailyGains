import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Play, Dumbbell, Activity, CheckCircle, ArrowRight, RotateCcw } from '../icons';
import { audio } from '../../services/audioService';
import { wger } from '../../services/wgerService';

export default function AiWorkoutRecommendationWidget({
  userMetrics,
  userProfile,
  onAddToReminder,
  onStartWorkout
}) {
  const [wgerCatalog, setWgerCatalog] = useState([]);
  const [isLoadingWger, setIsLoadingWger] = useState(false);
  const [apiSource, setApiSource] = useState('Local Cache');
  const [addedNotice, setAddedNotice] = useState(null);

  // Extract biometrics: Height, Weight, Age, BMI
  const heightCm = parseFloat(userMetrics?.height_cm || userMetrics?.height) || 175;
  const weightKg = parseFloat(userMetrics?.weight_kg || userMetrics?.weight) || 72;
  const age = parseInt(userMetrics?.age || userProfile?.age) || 26;
  const userName = userProfile?.user_name || 'Athlete';

  // Calculate BMI: Weight (kg) / (Height (m) ^ 2)
  const heightM = Math.max(0.5, heightCm / 100);
  const calculatedBmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  const activeBmi = parseFloat(userMetrics?.bmi_value || userMetrics?.bmi) || calculatedBmi;

  // 1. Fetch exercises from Wger API on mount
  useEffect(() => {
    let isMounted = true;
    const loadWgerData = async () => {
      setIsLoadingWger(true);
      try {
        const data = await wger.fetchExercises();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setWgerCatalog(data);
          setApiSource(wger.cachedExercises ? 'Wger API (Live Cache)' : 'Wger Core Catalog');
        }
      } catch (err) {
        if (isMounted) {
          setApiSource('Wger Fallback Mode');
        }
      } finally {
        if (isMounted) {
          setIsLoadingWger(false);
        }
      }
    };
    loadWgerData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Compute dynamic recommendations based on biometric rules & Wger catalog
  const recommendation = wger.getPersonalizedRecommendations(wgerCatalog, {
    bmi: activeBmi,
    age: age,
    height: heightCm,
    weight: weightKg
  });

  // 3. Interactive Action: "+ Add to Workout Reminder"
  const handleAddToReminderClick = (exercise) => {
    audio.playClick();
    if (onAddToReminder) {
      onAddToReminder({
        name: exercise.name,
        durationValue: exercise.durationValue || 30,
        durationUnit: exercise.durationUnit || 'minutes',
        days: exercise.days || ['Mon', 'Wed', 'Fri'],
        reminderTime: '08:00',
        prescription: exercise.prescription || '3 Sets × 12 Reps'
      });
    }

    setAddedNotice(`"${exercise.name}" loaded into Quick Workout Reminder!`);
    setTimeout(() => setAddedNotice(null), 4000);

    // Smoothly scroll to the Quick Workout Reminder card
    const targetElement = document.getElementById('quick-reminder-card');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 4. Quick Action: Start Workout Set directly
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
      padding: '24px 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      position: 'relative'
    }}>
      {/* 1. Header with Wger Badge & Biometric Context */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            padding: '7px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.12)',
            color: 'var(--accent-cyan)'
          }}>
            <Sparkles size={20} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Personalized Recommendations
              </h2>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--accent-blue)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                Wger API Powered
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: recommendation.themeColor,
                border: `1px solid ${recommendation.themeColor}40`
              }}>
                {recommendation.protocolBadge}
              </span>
            </div>

            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '3px'
            }}>
              Biometric Profile: <strong style={{ color: 'var(--text-main)' }}>{userName}</strong> • Age <strong style={{ color: 'var(--text-main)' }}>{age}</strong> • BMI <strong style={{ color: recommendation.themeColor }}>{activeBmi}</strong> ({weightKg}kg / {heightCm}cm)
            </div>
          </div>
        </div>

        {/* Protocol Focus Tag & Source indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            color: 'var(--text-secondary)'
          }}>
            <Activity size={13} style={{ color: recommendation.themeColor }} />
            <span>{recommendation.protocolTitle}</span>
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Source: {apiSource}
          </span>
        </div>
      </div>

      {/* 2. Biometric Rationale Banner */}
      <div style={{
        background: 'var(--bg-card-subtle)',
        border: `1px solid ${recommendation.themeColor}30`,
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '0.84rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '5px',
          height: '28px',
          borderRadius: '4px',
          background: recommendation.themeColor,
          flexShrink: 0
        }} />
        <div>
          <strong style={{ color: recommendation.themeColor, marginRight: '6px' }}>Biometric Prescription:</strong>
          {recommendation.protocolSummary}
          {age >= 50 && (
            <span style={{ display: 'block', marginTop: '3px', fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
              • Age 50+ Priority: Emphasizing gentle joint articulation, zero-impact spinal loads, and postural alignment.
            </span>
          )}
        </div>
      </div>

      {/* Added to Reminder Toast */}
      {addedNotice && (
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
          <span>{addedNotice}</span>
        </div>
      )}

      {/* 3. Dynamic Exercise Cards Grid (3 to 5 Cards from Wger API) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {recommendation.exercises.map((ex) => (
          <div
            key={ex.id}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
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
            {/* Card Content */}
            <div>
              {/* Title & Category Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '6px'
              }}>
                <h3 style={{
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {ex.name}
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: 'var(--accent-cyan-light)',
                  color: 'var(--accent-cyan)',
                  whiteSpace: 'nowrap'
                }}>
                  {ex.category}
                </span>
              </div>

              {/* Target Muscle Group & Equipment */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'var(--accent-blue-light)',
                  color: 'var(--accent-blue)'
                }}>
                  Target: {ex.muscles}
                </span>
                {ex.equipment && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-muted)'
                  }}>
                    {ex.equipment}
                  </span>
                )}
              </div>

              {/* Quick Instructions / Description Summary */}
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                margin: '0 0 10px',
                maxHeight: '68px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {ex.description}
              </p>

              {/* Suggested Prescription */}
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {ex.prescription}
                </span>
                <span>
                  {ex.durationValue} {ex.durationUnit}
                </span>
              </div>
            </div>

            {/* Interactive Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              {/* "+ Add to Workout Reminder" Button */}
              <button
                type="button"
                onClick={() => handleAddToReminderClick(ex)}
                className="cyber-btn cyber-btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 600
                }}
                title="Populate Quick Workout Reminder with this exercise"
              >
                <Clock size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>+ Add to Reminder</span>
              </button>

              {/* "+ Start Workout" Button */}
              <button
                type="button"
                onClick={() => handleStartWorkoutClick(ex)}
                className="cyber-btn cyber-btn-cyan"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 600
                }}
                title="Start and record this exercise now"
              >
                <Play size={13} />
                <span>Start Set</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
