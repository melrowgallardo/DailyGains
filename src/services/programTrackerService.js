// Program Routine Day Progress Tracker & Progressive Intensity Service
// Manages training day progression, program commitments, and intensity scaling phases.

const STORAGE_KEY_PROGRAM = 'dailygains_program_tracker';

export const PROGRAM_PHASES = {
  ADAPTATION: {
    key: 'adaptation',
    minDay: 1,
    maxDay: 7,
    phaseName: 'Foundation Phase',
    stageName: 'Beginner / Adaptation Stage',
    intensityLabel: 'Light Intensity',
    intensityDesc: 'Prevents overtraining, sore joints & early burnout',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    volumeMultiplier: 0.7,
    defaultDuration: 20
  },
  BUILDING: {
    key: 'building',
    minDay: 8,
    maxDay: 21,
    phaseName: 'Progressive Building Phase',
    stageName: 'Progressive Building Stage',
    intensityLabel: 'Moderate Intensity',
    intensityDesc: 'Progressive overload, hypertrophy stimulus & endurance conditioning',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    volumeMultiplier: 1.0,
    defaultDuration: 30
  },
  PEAK: {
    key: 'peak',
    minDay: 22,
    maxDay: 9999,
    phaseName: 'Peak Conditioning Phase',
    stageName: 'Peak Conditioning Stage',
    intensityLabel: 'Peak Intensity',
    intensityDesc: 'Maximum athletic output, muscular density & full metabolic resistance',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    volumeMultiplier: 1.3,
    defaultDuration: 40
  }
};

class ProgramTrackerService {
  constructor() {
    this.listeners = new Set();
  }

  // Subscribe to changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const data = this.getProgramData();
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
    // Dispatch window custom event for cross-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dailygains_program_changed', { detail: data }));
    }
  }

  // Get current program configuration from storage or defaults
  getProgramData() {
    const todayStr = new Date().toISOString().slice(0, 10);
    let stored = null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRAM);
      if (raw) {
        stored = JSON.parse(raw);
      }
    } catch {
      // Storage parse fallback
    }

    const startDate = stored?.startDate || todayStr;
    const commitmentWeeks = Math.max(1, Number(stored?.commitmentWeeks) || 4);
    const totalDays = commitmentWeeks * 7;

    // Calculate elapsed calendar days from start date
    let calculatedDay = 1;
    try {
      const startMs = new Date(startDate).setHours(0, 0, 0, 0);
      const nowMs = new Date().setHours(0, 0, 0, 0);
      const diffMs = nowMs - startMs;
      const dayDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      calculatedDay = Math.max(1, dayDiff);
    } catch {
      calculatedDay = 1;
    }

    // Allow manual day override if user explicitly selected/stepped their day
    let currentDay = stored?.manualDay !== undefined && stored.manualDay !== null
      ? Math.max(1, Number(stored.manualDay))
      : calculatedDay;

    // Bound day to totalDays if past program completion
    const isCompleted = currentDay > totalDays;
    const clampedDay = Math.min(currentDay, totalDays);

    const phase = this.getProgressionPhase(currentDay, totalDays);

    return {
      startDate,
      commitmentWeeks,
      totalDays,
      currentDay,
      displayDay: clampedDay,
      isCompleted,
      progressPercent: Math.min(100, Math.max(1, Math.round((clampedDay / totalDays) * 100))),
      isManualOverride: stored?.manualDay !== undefined && stored.manualDay !== null,
      phase
    };
  }

  // Calculate progression phase and visual badges for any specific day
  getProgressionPhase(day = 1, totalDays = 28) {
    const currentDay = Math.max(1, Number(day) || 1);
    let phaseConfig = PROGRAM_PHASES.ADAPTATION;

    if (currentDay >= 8 && currentDay <= 21) {
      phaseConfig = PROGRAM_PHASES.BUILDING;
    } else if (currentDay >= 22) {
      phaseConfig = PROGRAM_PHASES.PEAK;
    }

    // Specific user-requested badges
    let statusBadge = `Day ${currentDay} Routine • Beginner Friendly Intensity`;
    let modeBadge = `Day ${currentDay} Adaptation Mode (Light Intensity - Prevents Overtraining)`;

    if (phaseConfig.key === 'building') {
      statusBadge = `Day ${currentDay} Routine • Progressive Building Intensity`;
      modeBadge = `Day ${currentDay} Progressive Building Mode (Moderate Volume & Progressive Overload)`;
    } else if (phaseConfig.key === 'peak') {
      statusBadge = `Day ${currentDay} Routine • Peak Performance Intensity`;
      modeBadge = `Day ${currentDay} Peak Conditioning Mode (Full Volume Resistance)`;
    }

    const routineBadge = `Day ${currentDay} - ${phaseConfig.phaseName}`;
    const dayProgress = `Day ${currentDay} of ${totalDays}`;

    return {
      ...phaseConfig,
      day: currentDay,
      totalDays,
      routineBadge,
      dayProgress,
      statusBadge,
      modeBadge
    };
  }

  // Set explicit current routine day
  setCurrentDay(day) {
    const cleanDay = Math.max(1, Number(day) || 1);
    const current = this.getProgramData();
    const updated = {
      startDate: current.startDate,
      commitmentWeeks: current.commitmentWeeks,
      manualDay: cleanDay
    };
    try {
      localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(updated));
    } catch { }
    this.notifyListeners();
    return this.getProgramData();
  }

  // Set program commitment duration in weeks
  setCommitmentWeeks(weeks) {
    const cleanWeeks = Math.max(1, Number(weeks) || 4);
    const current = this.getProgramData();
    const updated = {
      ...current,
      commitmentWeeks: cleanWeeks
    };
    try {
      localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(updated));
    } catch { }
    this.notifyListeners();
    return this.getProgramData();
  }

  // Set program start date
  setStartDate(dateStr) {
    const current = this.getProgramData();
    const updated = {
      ...current,
      startDate: dateStr,
      manualDay: null // Clear manual override to sync with calendar
    };
    try {
      localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(updated));
    } catch { }
    this.notifyListeners();
    return this.getProgramData();
  }

  // Reset program to Day 1 starting today
  resetToDayOne(commitmentWeeks = 4) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const updated = {
      startDate: todayStr,
      commitmentWeeks: Math.max(1, Number(commitmentWeeks) || 4),
      manualDay: 1
    };
    try {
      localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(updated));
    } catch { }
    this.notifyListeners();
    return this.getProgramData();
  }
}

export const programTracker = new ProgramTrackerService();

/**
 * Detects the workout metric category from an exercise name:
 * - 'distance': Cardio / outdoor workouts (Jogging, Running, Cycling, Treadmill, Walking)
 * - 'isometric': Isometric / static hold workouts (Plank, Wall Sit, Hollow Hold)
 * - 'reps': Repetition-based bodyweight / strength (Push-ups, Squats, Sit-ups, Lunges)
 */
export function detectExerciseType(exerciseName = '') {
  const name = (exerciseName || '').toLowerCase().trim();
  if (!name) return 'reps';

  // Distance / Cardio
  if (
    name.includes('jog') || 
    name.includes('run') || 
    name.includes('sprint') || 
    name.includes('cycl') || 
    name.includes('bike') || 
    name.includes('treadmill') || 
    name.includes('walk') || 
    name.includes('rowing') || 
    name.includes('elliptical') || 
    name.includes('swim') ||
    name.includes('distance')
  ) {
    return 'distance';
  }

  // Isometric / Static Hold
  if (
    name.includes('plank') || 
    name.includes('wall sit') || 
    name.includes('hollow') || 
    name.includes('isometric') || 
    name.includes('hold') || 
    name.includes('l-sit') || 
    name.includes('bridge hold') || 
    name.includes('stretch')
  ) {
    return 'isometric';
  }

  // Default: Repetition-Based Bodyweight / Strength
  return 'reps';
}

/**
 * Dynamic day-based target & reps recommendation generator.
 * Tailors volume targets, units (reps, meters, km, seconds), and auto-fill presets
 * based on the active training day and exercise category.
 */
export function getDayRecommendation(day = 1, customExerciseName = '') {
  const cleanDay = Math.max(1, Number(day) || 1);
  const rawName = (customExerciseName || '').trim();
  const category = detectExerciseType(rawName);

  // Capitalize first letter of exercise for clean display
  const formatName = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // 1. DISTANCE-BASED (Cardio / Outdoor Workouts: Jogging, Running, Cycling, Treadmill)
  if (category === 'distance') {
    const displayName = formatName(rawName) || 'Jogging';

    if (cleanDay === 1) {
      return {
        day: 1,
        category: 'distance',
        stage: 'Foundation Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day 1 ${displayName} Guide:`,
        recommendationSummary: `Recommended 500 Meters (or 10 Mins Light Pace)`,
        targetValue: 500,
        targetUnit: 'meters',
        quickFillText: `💡 Apply Day 1 Recommendation: 500 Meters`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: 500,
          duration_unit: 'meters',
          prescription: '500m (or 10 Mins Light Pace)'
        },
        intensityBadge: 'Light Aerobic Base',
        intensityColor: '#06b6d4',
        rationale: 'Keep steady breathing and relaxed cadence.'
      };
    } else if (cleanDay <= 7) {
      const meters = Math.min(1000, 500 + (cleanDay - 1) * 100);
      return {
        day: cleanDay,
        category: 'distance',
        stage: 'Adaptation Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
        recommendationSummary: `Recommended ${meters} Meters (or 15 Mins Moderate Pace)`,
        targetValue: meters,
        targetUnit: 'meters',
        quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${meters} Meters`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: meters,
          duration_unit: 'meters',
          prescription: `${meters}m (or 15 Mins Moderate Pace)`
        },
        intensityBadge: 'Aerobic Progression',
        intensityColor: '#06b6d4',
        rationale: 'Build aerobic stamina and steady breathing rhythm.'
      };
    } else if (cleanDay <= 21) {
      const km = cleanDay >= 15 ? 2.5 : 1.5;
      return {
        day: cleanDay,
        category: 'distance',
        stage: 'Progressive Building Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
        recommendationSummary: `Recommended ${km} km (or 25 Mins Steady Pace)`,
        targetValue: km,
        targetUnit: 'km',
        quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${km} km`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: km,
          duration_unit: 'km',
          prescription: `${km} km (or 25 Mins Steady Pace)`
        },
        intensityBadge: 'Moderate Endurance',
        intensityColor: '#3b82f6',
        rationale: 'Enhance cardiovascular capacity and aerobic endurance.'
      };
    } else {
      const km = cleanDay >= 26 ? 5 : 3.5;
      return {
        day: cleanDay,
        category: 'distance',
        stage: 'Peak Conditioning Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
        recommendationSummary: `Recommended ${km} km (or 35-40 Mins High Tempo)`,
        targetValue: km,
        targetUnit: 'km',
        quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${km} km`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: km,
          duration_unit: 'km',
          prescription: `${km} km (High Tempo Interval)`
        },
        intensityBadge: 'Peak Cardio Conditioning',
        intensityColor: '#10b981',
        rationale: 'High-tempo aerobic conditioning and maximal fat oxidation.'
      };
    }
  }

  // 2. TIME / DURATION-BASED (Isometric / Static Hold: Plank, Wall Sit, Hollow Hold)
  if (category === 'isometric') {
    const displayName = formatName(rawName) || 'Plank';

    if (cleanDay === 1) {
      return {
        day: 1,
        category: 'isometric',
        stage: 'Foundation Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day 1 ${displayName} Guide:`,
        recommendationSummary: `Recommended 30 Seconds Hold / 2 Sets`,
        targetValue: 30,
        targetUnit: 'seconds',
        quickFillText: `💡 Apply Day 1 Recommendation: 30 Seconds`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: 30,
          duration_unit: 'seconds',
          prescription: '2 Sets × 30 Secs Hold'
        },
        intensityBadge: 'Foundation Core Hold',
        intensityColor: '#06b6d4',
        rationale: 'Core engaged, neutral spine, avoid sagging hips.'
      };
    } else if (cleanDay <= 7) {
      const secs = Math.min(50, 30 + (cleanDay - 1) * 3);
      return {
        day: cleanDay,
        category: 'isometric',
        stage: 'Adaptation Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
        recommendationSummary: `Recommended ${secs} Seconds Hold / 3 Sets`,
        targetValue: secs,
        targetUnit: 'seconds',
        quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${secs} Seconds`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: secs,
          duration_unit: 'seconds',
          prescription: `3 Sets × ${secs} Secs Hold`
        },
        intensityBadge: 'Progressive Hold',
        intensityColor: '#06b6d4',
        rationale: 'Reinforce intra-abdominal pressure and core stability.'
      };
    } else if (cleanDay <= 21) {
      const secs = cleanDay >= 15 ? 75 : 60;
      return {
        day: cleanDay,
        category: 'isometric',
        stage: 'Progressive Building Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
        recommendationSummary: `Recommended ${secs} Seconds Hold / 3-4 Sets`,
        targetValue: secs,
        targetUnit: 'seconds',
        quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${secs} Seconds`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: secs,
          duration_unit: 'seconds',
          prescription: `3-4 Sets × ${secs} Secs Hold`
        },
        intensityBadge: 'Moderate Core Volume',
        intensityColor: '#3b82f6',
        rationale: 'Progressive isometric load and core fortitude.'
      };
    } else {
      return {
        day: cleanDay,
        category: 'isometric',
        stage: 'Peak Conditioning Stage',
        exerciseName: displayName,
        guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
        recommendationSummary: `Recommended 90 Seconds Hold / 4 Sets`,
        targetValue: 90,
        targetUnit: 'seconds',
        quickFillText: `💡 Apply Day ${cleanDay} Recommendation: 90 Seconds`,
        autoFillPayload: {
          exercise_name: displayName,
          duration_value: 90,
          duration_unit: 'seconds',
          prescription: '4 Sets × 90 Secs Hold (Peak)'
        },
        intensityBadge: 'Peak Isometric Stamina',
        intensityColor: '#10b981',
        rationale: 'Maximum core fortitude and tension under fatigue.'
      };
    }
  }

  // 3. REPETITION-BASED (Home Workouts / Bodyweight / Strength: Push-ups, Squats, Sit-ups, Lunges)
  const displayName = formatName(rawName) || 'Push-ups';

  if (cleanDay === 1) {
    return {
      day: 1,
      category: 'reps',
      stage: 'Foundation Stage',
      exerciseName: displayName,
      guideBadgeLabel: `💡 Day 1 ${displayName} Guide:`,
      recommendationSummary: `Recommended 5 - 10 Reps / 2 Sets`,
      targetValue: 8,
      targetUnit: 'reps',
      quickFillText: `💡 Apply Day 1 Recommendation: 8 Reps`,
      autoFillPayload: {
        exercise_name: displayName,
        duration_value: 8,
        duration_unit: 'reps',
        prescription: `2 Sets × 8 Reps`
      },
      intensityBadge: 'Light Warm-up Volume',
      intensityColor: '#06b6d4',
      rationale: 'Focus on form, controlled tempo, and full range of motion.'
    };
  } else if (cleanDay <= 7) {
    const reps = Math.min(12, 8 + (cleanDay - 1));
    return {
      day: cleanDay,
      category: 'reps',
      stage: 'Adaptation Stage',
      exerciseName: displayName,
      guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
      recommendationSummary: `Recommended 10 - 12 Reps / 3 Sets`,
      targetValue: reps,
      targetUnit: 'reps',
      quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${reps} Reps`,
      autoFillPayload: {
        exercise_name: displayName,
        duration_value: reps,
        duration_unit: 'reps',
        prescription: `3 Sets × ${reps} Reps`
      },
      intensityBadge: 'Progressive Increase',
      intensityColor: '#06b6d4',
      rationale: 'Progressive muscle activation and neuromuscular adaptation.'
    };
  } else if (cleanDay <= 21) {
    const reps = Math.min(16, 12 + Math.floor((cleanDay - 8) / 2));
    const sets = cleanDay >= 14 ? 4 : 3;
    return {
      day: cleanDay,
      category: 'reps',
      stage: 'Progressive Building Stage',
      exerciseName: displayName,
      guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
      recommendationSummary: `Recommended 12 - 16 Reps / ${sets} Sets`,
      targetValue: reps,
      targetUnit: 'reps',
      quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${reps} Reps`,
      autoFillPayload: {
        exercise_name: displayName,
        duration_value: reps,
        duration_unit: 'reps',
        prescription: `${sets} Sets × ${reps} Reps`
      },
      intensityBadge: 'Moderate Volume',
      intensityColor: '#3b82f6',
      rationale: 'Hypertrophy volume loading and muscular stamina expansion.'
    };
  } else {
    const reps = Math.min(22, 16 + (cleanDay - 22));
    return {
      day: cleanDay,
      category: 'reps',
      stage: 'Peak Conditioning Stage',
      exerciseName: displayName,
      guideBadgeLabel: `💡 Day ${cleanDay} ${displayName} Guide:`,
      recommendationSummary: `Recommended 16 - 20+ Reps / 4-5 Sets`,
      targetValue: reps,
      targetUnit: 'reps',
      quickFillText: `💡 Apply Day ${cleanDay} Recommendation: ${reps} Reps`,
      autoFillPayload: {
        exercise_name: displayName,
        duration_value: reps,
        duration_unit: 'reps',
        prescription: `4-5 Sets × ${reps} Reps`
      },
      intensityBadge: 'Peak Full Volume',
      intensityColor: '#10b981',
      rationale: 'Maximum resistance volume and high-density athletic output.'
    };
  }
}

