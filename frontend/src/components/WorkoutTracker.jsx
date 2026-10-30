import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Dumbbell, 
  Flame, 
  Clock, 
  Layers, 
  Activity, 
  Calendar, 
  Check, 
  Sliders, 
  Sparkles, 
  Zap, 
  ArrowUpDown 
} from './icons';
import confetti from 'canvas-confetti';
import { audio } from '../services/audioService';

export default function WorkoutTracker({ 
  logs = [], 
  exercises = [], 
  createLog, 
  deleteLog, 
  createExercise,
  deleteExercise,
  isModalOpen,
  closeLogModal,
  openLogModal,
  initialExercise
}) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('ALL');
  const [isNewExerciseOpen, setIsNewExerciseOpen] = useState(false);

  // Form State for Logging Workout
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialExercise?.id || (exercises[0]?.id || ''));
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(60);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [caloriesBurned, setCaloriesBurned] = useState(180);
  const [rpe, setRpe] = useState(8);
  const [notes, setNotes] = useState('');

  // Form State for Creating Custom Exercise
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Strength');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExEquipment, setNewExEquipment] = useState('Barbell');
  const [newExDescription, setNewExDescription] = useState('');

  // Auto-update calories when sets, weight or duration changes
  const handleDurationChange = (val) => {
    const mins = Math.max(1, Number(val) || 0);
    setDurationMinutes(mins);
    // Rough estimate: ~7-10 kcal per minute based on RPE
    setCaloriesBurned(Math.round(mins * (6 + (rpe * 0.5))));
  };

  const handleRpeChange = (val) => {
    const r = Number(val);
    setRpe(r);
    setCaloriesBurned(Math.round(durationMinutes * (6 + (r * 0.5))));
  };

  // Quick weight adjustment helpers
  const adjustWeight = (delta) => {
    audio.playClick();
    setWeight((prev) => Math.max(0, parseFloat((prev + delta).toFixed(2))));
  };

  // Submit Workout Log
  const handleSubmitLog = async (e) => {
    if (e) e.preventDefault();
    audio.playSuccess();

    // Trigger Cyber Confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00f3ff', '#ff6400', '#10f5a0', '#ffffff']
      });
    } catch {
      // Ignore if confetti not supported
    }

    const matchedEx = exercises.find(ex => Number(ex.id) === Number(selectedExerciseId));
    const payload = {
      exercise_id: matchedEx ? matchedEx.id : null,
      exercise_name: matchedEx ? matchedEx.name : 'Custom Protocol',
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
      weight_unit: weightUnit,
      duration_minutes: Number(durationMinutes),
      calories_burned: Number(caloriesBurned),
      rpe: Number(rpe),
      notes: notes.trim(),
      logged_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    await createLog(payload);
    closeLogModal();
    setNotes('');
  };

  // Submit New Exercise Module
  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    audio.playSuccess();
    const created = await createExercise({
      name: newExName.trim(),
      category: newExCategory,
      target_muscle: newExMuscle,
      equipment: newExEquipment,
      icon: 'dumbbell',
      description: newExDescription.trim()
    });

    setIsNewExerciseOpen(false);
    setNewExName('');
    setNewExDescription('');
    if (created) {
      setSelectedExerciseId(created.id);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.exercise_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMuscle = selectedMuscle === 'ALL' || 
      log.target_muscle?.toUpperCase() === selectedMuscle ||
      log.category?.toUpperCase() === selectedMuscle;

    return matchesSearch && matchesMuscle;
  });

  const muscleFilters = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO'];

  // RPE descriptor
  const getRpeDescription = (val) => {
    if (val <= 4) return 'WARM-UP / LOW RESISTANCE';
    if (val <= 6) return 'MODERATE / SPEED WORK';
    if (val <= 8) return 'HYPERTROPHY THRESHOLD (2-3 REPS IN RESERVE)';
    if (val === 9) return 'HIGH TENSION (1 REP IN RESERVE)';
    return 'MAXIMUM OVERDRIVE // TECHNICAL FAILURE';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Action & Filter Bar */}
      <div className="cyber-panel cyber-corners" style={{ padding: '18px 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dumbbell size={20} style={{ color: 'var(--cyber-cyan)' }} />
              <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                WORKOUT PROTOCOL TRACKER
              </h2>
            </div>
            <p className="font-tech" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              RECORD SETS, MECHANICAL LOAD, REPETITIONS, AND METABOLIC BURN
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                audio.playClick();
                setIsNewExerciseOpen(true);
              }}
              className="cyber-btn cyber-btn-ghost font-tech"
            >
              <Zap size={15} style={{ color: 'var(--cyber-orange)' }} />
              <span>+ NEW EXERCISE MODULE</span>
            </button>

            <button
              onClick={() => {
                audio.playClick();
                openLogModal();
              }}
              className="cyber-btn cyber-btn-cyan font-display"
            >
              <Plus size={16} />
              <span>+ RECORD WORKOUT LOG</span>
            </button>
          </div>
        </div>

        {/* Search & Muscle Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={16} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
            />
            <input
              type="text"
              placeholder="Search by exercise name, notes, muscle group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cyber-input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Muscle Category Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}>
            {muscleFilters.map((m) => (
              <button
                key={m}
                onClick={() => {
                  audio.playClick();
                  setSelectedMuscle(m);
                }}
                className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  borderColor: selectedMuscle === m ? 'var(--cyber-cyan)' : 'var(--border-subtle)',
                  background: selectedMuscle === m ? 'rgba(0, 243, 255, 0.15)' : 'transparent',
                  color: selectedMuscle === m ? 'var(--cyber-cyan)' : 'var(--text-muted)'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table / Cards Feed */}
      <div className="cyber-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="font-tech" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            PROTOCOL EXECUTION HISTORY ({filteredLogs.length} LOGS)
          </span>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--cyber-cyan)' }}>
            AUTO-SYNCED TO MYSQL
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <Dumbbell size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <div className="font-tech" style={{ fontSize: '1.1rem' }}>NO MATCHING WORKOUT LOGS FOUND</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try clearing your filters or record a new set!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLogs.map((log) => {
              const tonnage = (Number(log.weight) || 0) * (Number(log.sets) || 1) * (Number(log.reps) || 10);
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 243, 255, 0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  {/* Left: Exercise & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: 'rgba(0, 243, 255, 0.1)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cyber-cyan)',
                      flexShrink: 0
                    }}>
                      <Dumbbell size={20} />
                    </div>
                    <div>
                      <div className="font-display" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {log.exercise_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span className="cyber-badge badge-cyan font-mono" style={{ fontSize: '0.65rem' }}>
                          {log.target_muscle || log.category || 'Hypertrophy'}
                        </span>
                        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {log.logged_at ? log.logged_at.slice(0, 16) : 'Recorded'}
                        </span>
                        {log.rpe && (
                          <span className="cyber-badge badge-orange font-mono" style={{ fontSize: '0.65rem' }}>
                            RPE {log.rpe}/10
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          "{log.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Metrics & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Sets x Reps @ Weight */}
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-display" style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--cyber-cyan)' }}>
                        {log.sets} SETS × {log.reps} REPS
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--cyber-amber)', fontWeight: 700 }}>
                        @ {log.weight} {log.weight_unit || 'kg'} <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({tonnage.toLocaleString()} kg total)</span>
                      </div>
                    </div>

                    {/* Calories & Duration */}
                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <div className="font-tech" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyber-orange)' }}>
                        <Flame size={13} style={{ display: 'inline', marginRight: '3px' }} />
                        {log.calories_burned || 0} KCAL
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {log.duration_minutes || 0} MINS
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        audio.playClick();
                        if (window.confirm(`Delete log record for "${log.exercise_name}"?`)) {
                          deleteLog(log.id);
                        }
                      }}
                      title="Delete log record"
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ color: 'var(--cyber-crimson)', borderColor: 'rgba(255, 26, 83, 0.3)', padding: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Record Workout Log */}
      {isModalOpen && (
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
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 26px',
            background: 'var(--bg-surface)',
            border: '2px solid var(--cyber-cyan)',
            boxShadow: 'var(--shadow-neon-cyan)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Dumbbell size={22} style={{ color: 'var(--cyber-cyan)' }} />
                <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                  LOG PROTOCOL EXECUTION
                </h3>
              </div>
              <button 
                onClick={closeLogModal}
                className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleSubmitLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Exercise Selector */}
              <div>
                <label className="cyber-label">SELECT EXERCISE MODULE</label>
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="cyber-select"
                  required
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} [{ex.target_muscle} - {ex.equipment}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Sets & Reps row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="cyber-label">SETS COMPLETED</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSets(Math.max(1, sets - 1))}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ width: '38px' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                      className="cyber-input font-mono"
                      style={{ textAlign: 'center' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setSets(sets + 1)}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ width: '38px' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="cyber-label">REPETITIONS PER SET</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setReps(Math.max(1, reps - 1))}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ width: '38px' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className="cyber-input font-mono"
                      style={{ textAlign: 'center' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setReps(reps + 1)}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm"
                      style={{ width: '38px' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Weight Load & Unit Toggle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="cyber-label" style={{ margin: 0 }}>WEIGHT LOAD</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        borderColor: weightUnit === 'kg' ? 'var(--cyber-cyan)' : 'var(--border-subtle)',
                        color: weightUnit === 'kg' ? 'var(--cyber-cyan)' : 'var(--text-muted)'
                      }}
                    >
                      KG
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        borderColor: weightUnit === 'lbs' ? 'var(--cyber-cyan)' : 'var(--border-subtle)',
                        color: weightUnit === 'lbs' ? 'var(--cyber-cyan)' : 'var(--text-muted)'
                      }}
                    >
                      LBS
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="1000"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="cyber-input font-display"
                    style={{ fontSize: '1.2rem', textAlign: 'center' }}
                    required
                  />
                </div>

                {/* Quick Weight Adjusters */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {[+1.25, +2.5, +5, +10, -2.5, -5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => adjustWeight(val)}
                      className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
                      style={{ flex: 1, padding: '3px 0', fontSize: '0.72rem' }}
                    >
                      {val > 0 ? `+${val}` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Estimated Calories */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="cyber-label">DURATION (MINUTES)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="cyber-input font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="cyber-label">CALORIES BURNED</label>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                    className="cyber-input font-mono"
                  />
                </div>
              </div>

              {/* RPE Exertion Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="cyber-label" style={{ margin: 0 }}>RPE INTENSITY (1 - 10)</label>
                  <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--cyber-orange)', fontWeight: 800 }}>
                    RPE {rpe}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rpe}
                  onChange={(e) => handleRpeChange(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--cyber-orange)', cursor: 'pointer' }}
                />
                <div className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--cyber-cyan)', marginTop: '4px' }}>
                  {getRpeDescription(rpe)}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="cyber-label">EXECUTION NOTES & TELEMETRY</label>
                <textarea
                  placeholder="E.g., Hit 102.5kg clean PR, explosive eccentric control, zero shoulder strain."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="cyber-input"
                  rows="2"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="cyber-btn cyber-btn-cyan font-display"
                style={{ padding: '12px', marginTop: '6px' }}
              >
                <Check size={18} />
                <span>CONFIRM PROTOCOL EXECUTION</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Exercise Module */}
      {isNewExerciseOpen && (
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
            maxWidth: '500px',
            padding: '24px 26px',
            background: 'var(--bg-surface)',
            border: '2px solid var(--cyber-orange)',
            boxShadow: 'var(--shadow-neon-orange)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={22} style={{ color: 'var(--cyber-orange)' }} />
                <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                  FORGE EXERCISE MODULE
                </h3>
              </div>
              <button 
                onClick={() => setIsNewExerciseOpen(false)}
                className="cyber-btn cyber-btn-ghost cyber-btn-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExercise} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="cyber-label">EXERCISE MODULE NAME</label>
                <input
                  type="text"
                  placeholder="E.g., Incline Neural Dumbbell Press"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="cyber-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="cyber-label">TARGET MUSCLE GROUP</label>
                  <select
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value)}
                    className="cyber-select"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Full Body">Full Body</option>
                  </select>
                </div>

                <div>
                  <label className="cyber-label">DISCIPLINE CATEGORY</label>
                  <select
                    value={newExCategory}
                    onChange={(e) => setNewExCategory(e.target.value)}
                    className="cyber-select"
                  >
                    <option value="Strength">Strength</option>
                    <option value="Hypertrophy">Hypertrophy</option>
                    <option value="Powerlifting">Powerlifting</option>
                    <option value="Isolation">Isolation</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Endurance">Endurance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="cyber-label">EQUIPMENT APPARATUS</label>
                <select
                  value={newExEquipment}
                  onChange={(e) => setNewExEquipment(e.target.value)}
                  className="cyber-select"
                >
                  <option value="Barbell">Barbell</option>
                  <option value="Dumbbell">Dumbbell</option>
                  <option value="Cable">Cable Pulley</option>
                  <option value="Machine">Pin-Loaded Machine</option>
                  <option value="Bodyweight">Bodyweight / Calisthenics</option>
                  <option value="Treadmill">Cardio Deck / Treadmill</option>
                </select>
              </div>

              <div>
                <label className="cyber-label">BIOMECHANICAL DESCRIPTION</label>
                <textarea
                  placeholder="Target trajectory and movement mechanics."
                  value={newExDescription}
                  onChange={(e) => setNewExDescription(e.target.value)}
                  className="cyber-input"
                  rows="2"
                />
              </div>

              <button
                type="submit"
                className="cyber-btn cyber-btn-orange font-display"
                style={{ padding: '12px', marginTop: '6px' }}
              >
                <Plus size={16} />
                <span>SAVE EXERCISE MODULE</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
