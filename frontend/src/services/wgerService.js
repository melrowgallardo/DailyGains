/**
 * DailyGains Wger Workout Manager API Service
 * Fetches dynamic exercise data from the free Wger REST API (https://wger.de/api/v2/exerciseinfo/?language=2)
 * Includes intelligent local caching, biometric category filtering, and offline fallbacks.
 */

import { programTracker } from './programTrackerService';

const WGER_API_URL = 'https://wger.de/api/v2/exerciseinfo/?language=2';
const STORAGE_KEY_WGER = 'dailygains_wger_exercises_cache';

// Helper: Strip HTML tags from Wger descriptions
export const stripHtml = (html) => {
  if (!html) return 'Execute with controlled form, steady breathing, and full range of motion.';
  const cleaned = html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 220 ? `${cleaned.slice(0, 215)}...` : cleaned;
};

// Rich curated fallback catalog mirroring Wger database schema
export const FALLBACK_WGER_EXERCISES = [
  // Compound Hypertrophy (Underweight Focus)
  {
    id: 101,
    name: 'Barbell Bench Press',
    category: 'Chest',
    muscles: 'Pectoralis major, Triceps brachii, Anterior deltoid',
    equipment: 'Barbell, Bench',
    description: 'Lie on the flat bench. Grip the barbell with hands slightly wider than shoulder width. Lower the bar smoothly to your mid-chest, pause briefly, and press upward explosively while keeping shoulder blades pinched.',
    focus: 'Compound Hypertrophy'
  },
  {
    id: 102,
    name: 'Barbell Full Back Squat',
    category: 'Legs',
    muscles: 'Quadriceps, Gluteus maximus, Hamstrings',
    equipment: 'Barbell, Squat Rack',
    description: 'Rest the bar comfortably across upper traps. Unrack, brace core, and descend by pushing hips back until thighs are parallel to floor. Drive through heels to ascend to starting standing position.',
    focus: 'Compound Strength'
  },
  {
    id: 103,
    name: 'Bent-Over Barbell Row',
    category: 'Back',
    muscles: 'Latissimus dorsi, Rhomboids, Trapezius',
    equipment: 'Barbell',
    description: 'Hinge forward at hips with spine neutral. Pull barbell upward toward lower ribcage by retracting shoulder blades. Control the descent to build back thickness and posture.',
    focus: 'Upper Body Mass'
  },
  {
    id: 104,
    name: 'Standing Alternating Dumbbell Curl',
    category: 'Arms',
    muscles: 'Biceps brachii, Brachialis',
    equipment: 'Dumbbell',
    description: 'Hold dumbbells at sides with palms facing inward. Curl one dumbbell upward while supinating wrist so palm faces shoulder at peak contraction. Squeeze bicep, then lower smoothly.',
    focus: 'Arm Hypertrophy'
  },
  {
    id: 105,
    name: 'Standing Overhead Military Press',
    category: 'Shoulders',
    muscles: 'Anterior deltoid, Triceps, Core',
    equipment: 'Barbell',
    description: 'Hold bar at collarbone height. Press vertically overhead to full lockout without hyperextending lower back. Keep core and glutes tight throughout repetition.',
    focus: 'Vertical Push'
  },

  // Calisthenics & Functional Balance (Normal Weight Focus)
  {
    id: 201,
    name: 'Classic Bodyweight Push-ups',
    category: 'Chest',
    muscles: 'Pectoralis major, Triceps, Core wall',
    equipment: 'Bodyweight',
    description: 'Maintain rigid plank posture from heels to crown. Lower chest until elbows reach 90 degrees, then push through palms to full lockout. Engage abs to protect lower back.',
    focus: 'Calisthenics Base'
  },
  {
    id: 202,
    name: 'Strict Bodyweight Pull-ups',
    category: 'Back',
    muscles: 'Latissimus dorsi, Biceps, Forearms',
    equipment: 'Pull-up Bar',
    description: 'Hang with overhand grip slightly wider than shoulders. Pull chest up toward the bar by driving elbows down toward hips. Lower with control to a dead hang.',
    focus: 'Vertical Pulling'
  },
  {
    id: 203,
    name: 'Isometric Core Plank',
    category: 'Abs',
    muscles: 'Rectus abdominis, Transverse abdominis',
    equipment: 'Bodyweight, Mat',
    description: 'Support body on forearms and toes with elbows beneath shoulders. Form a straight line from head to heels, actively bracing abdominal wall and glutes for the duration.',
    focus: 'Core Stabilization'
  },
  {
    id: 204,
    name: 'Bodyweight Air Squats',
    category: 'Legs',
    muscles: 'Quadriceps, Gluteus, Calves',
    equipment: 'Bodyweight',
    description: 'Stand with feet shoulder-width apart. Squat down deeply keeping chest tall and knees tracking over toes. Drive through midfoot to stand tall.',
    focus: 'Functional Mobility'
  },
  {
    id: 205,
    name: 'Dumbbell Lateral Shoulder Raises',
    category: 'Shoulders',
    muscles: 'Lateral deltoid',
    equipment: 'Dumbbell',
    description: 'Raise dumbbells outward to sides with slight elbow bend until arms reach parallel with floor. Pause briefly at peak height to target shoulder silhouette.',
    focus: 'Shoulder Symmetry'
  },

  // Cardio & High-Calorie Burn (Overweight / Obese Focus)
  {
    id: 301,
    name: 'High-Cadence Jumping Jacks',
    category: 'Cardio',
    muscles: 'Cardiovascular system, Calves, Deltoids',
    equipment: 'Bodyweight',
    description: 'Jump feet outward while raising arms overhead simultaneously in rhythmic cadence. Land softly on balls of feet and return to center. Sustained heart rate spike.',
    focus: 'Cardio Calorie Burn'
  },
  {
    id: 302,
    name: 'Dynamic High Knee Runs',
    category: 'Cardio',
    muscles: 'Hip flexors, Core, Cardiovascular',
    equipment: 'Bodyweight',
    description: 'Drive alternating knees up to waist height rapidly in place. Pump arms in coordination to elevate oxygen consumption and metabolic fat burning.',
    focus: 'HIIT Interval'
  },
  {
    id: 303,
    name: 'Incline Treadmill Power Walk',
    category: 'Cardio',
    muscles: 'Calves, Glutes, Cardiovascular',
    equipment: 'Treadmill',
    description: 'Walk briskly at a 6-12% incline at steady Zone 2 heart rate (3.5 - 4.5 mph). Maximizes lipid fuel oxidation with gentle, zero-impact joint protection.',
    focus: 'Low-Impact Cardio'
  },
  {
    id: 304,
    name: 'Stationary Cycling Interval Surge',
    category: 'Cardio',
    muscles: 'Quadriceps, Hamstrings, Heart',
    equipment: 'Stationary Bike',
    description: 'Alternate between moderate recovery cadence (70 RPM) and high-resistance sprints (95 RPM). Delivers intense cardiovascular output with zero knee impact.',
    focus: 'Joint-Friendly VO2'
  },
  {
    id: 305,
    name: 'Isometric Wall Sit Hold',
    category: 'Legs',
    muscles: 'Quadriceps, Glutes, Core',
    equipment: 'Wall, Bodyweight',
    description: 'Slide back down wall until thighs are parallel to ground with knees bent at 90 degrees. Hold position while pressing lower back firmly against the wall.',
    focus: 'Low-Impact Strength'
  },

  // Age 50+ Mobility & Longevity Focus
  {
    id: 401,
    name: 'Low-Impact Brisk Fitness Walk',
    category: 'Cardio',
    muscles: 'Cardiovascular, Glutes, Lower Body',
    equipment: 'Bodyweight, Shoes',
    description: 'Maintain an upright posture and brisk stride for continuous cardiovascular conditioning and joint lubrication without jarring impact.',
    focus: 'Longevity Cardio'
  },
  {
    id: 402,
    name: 'Incline Wall or Bench Push-ups',
    category: 'Chest',
    muscles: 'Pectoralis major, Anterior deltoid',
    equipment: 'Bench, Wall',
    description: 'Perform push-ups with hands elevated on a bench or wall. Reduces wrist and lumbar shear strain while preserving upper body pushing strength.',
    focus: 'Joint-Safe Push'
  },
  {
    id: 403,
    name: 'Bird-Dog Core Stability Hold',
    category: 'Abs',
    muscles: 'Erector spinae, Core wall, Gluteus',
    equipment: 'Mat',
    description: 'On hands and knees, extend opposite arm and leg horizontally. Pause for 2 seconds with hips level to reinforce spinal integrity and core balance.',
    focus: 'Spinal Health'
  },
  {
    id: 404,
    name: 'Seated Cable Posture Rows',
    category: 'Back',
    muscles: 'Rhomboids, Latissimus dorsi, Mid-trapezius',
    equipment: 'Cable Machine',
    description: 'Sit upright with knees slightly bent. Pull handle toward navel, holding scapular squeeze for 1 second to combat kyphotic forward head posture.',
    focus: 'Postural Alignment'
  },
  {
    id: 405,
    name: 'Chair Squat & Controlled Stand',
    category: 'Legs',
    muscles: 'Quadriceps, Gluteus, Hip stabilizers',
    equipment: 'Chair, Bodyweight',
    description: 'Sit back down to touch a sturdy chair lightly, then drive upward to standing. Strengthens hip and knee extension for functional everyday mobility.',
    focus: 'Functional Mobility'
  }
];

class WgerService {
  constructor() {
    this.cachedExercises = null;
    this.isFetching = false;
  }

  // Fetch exercises from Wger REST API with intelligent caching & fallback
  async fetchExercises() {
    // 1. Try reading from memory or LocalStorage cache first for instant load
    if (!this.cachedExercises) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_WGER);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedExercises = parsed;
          }
        }
      } catch {
        // Cache read error
      }
    }

    // 2. Fetch fresh dataset from Wger API in the background if network allows
    if (!this.isFetching) {
      this.isFetching = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(WGER_API_URL, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.results) && json.results.length > 0) {
            const normalized = json.results
              .filter(item => item.name && item.category)
              .map(item => ({
                id: item.id,
                name: item.name.trim(),
                category: item.category?.name || 'General',
                muscles: Array.isArray(item.muscles) && item.muscles.length > 0 
                  ? item.muscles.map(m => m.name).join(', ') 
                  : 'Full Body',
                equipment: Array.isArray(item.equipment) && item.equipment.length > 0 
                  ? item.equipment.map(e => e.name).join(', ') 
                  : 'Bodyweight',
                description: stripHtml(item.description),
                focus: item.category?.name || 'Strength'
              }));

            if (normalized.length > 0) {
              this.cachedExercises = normalized;
              localStorage.setItem(STORAGE_KEY_WGER, JSON.stringify(normalized));
            }
          }
        }
      } catch (err) {
        // Network timeout / sandbox isolation / CORS fallback
        // Will seamlessly use cached exercises or bundled fallback
      } finally {
        this.isFetching = false;
      }
    }

    return this.cachedExercises && this.cachedExercises.length > 0
      ? this.cachedExercises
      : FALLBACK_WGER_EXERCISES;
  }

  // Calculate dynamic recommendations based on biometric rules and program routine progression
  getPersonalizedRecommendations(catalog, { bmi, age, height = 175, weight = 70, programDay = null, commitmentWeeks = null }) {
    const list = Array.isArray(catalog) && catalog.length > 0 ? catalog : FALLBACK_WGER_EXERCISES;
    const userAge = Number(age) || 26;
    const calculatedBmi = Number(bmi) || parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1)) || 22.9;

    // Retrieve routine day progression parameters
    const progData = programTracker.getProgramData();
    const currentDay = programDay !== null && programDay !== undefined ? Math.max(1, Number(programDay)) : progData.currentDay;
    const totalWeeks = commitmentWeeks !== null && commitmentWeeks !== undefined ? Math.max(1, Number(commitmentWeeks)) : progData.commitmentWeeks;
    const totalDays = totalWeeks * 7;
    const progression = programTracker.getProgressionPhase(currentDay, totalDays);

    let targetCategories = [];
    let protocolTitle = '';
    let protocolBadge = '';
    let protocolSummary = '';
    let themeColor = progression.color || '#10b981';
    let durationValue = progression.defaultDuration || 30;
    let durationUnit = 'minutes';
    let suggestedDays = ['Mon', 'Wed', 'Fri'];

    // Rule 1: Age Adjustment (Age >= 50) -> Prioritize low-impact, joint-friendly cardio and core stability
    if (userAge >= 50) {
      protocolTitle = 'Joint-Friendly Mobility & Core Stability';
      protocolBadge = 'AGE 50+ LONGEVITY PROTOCOL';
      protocolSummary = 'Prioritizing low-impact cardiovascular conditioning, core stability, and gentle joint lubrication to preserve bone density and posture.';
      targetCategories = ['Cardio', 'Abs', 'Back', 'Legs', 'Chest'];
      durationValue = 25;
      durationUnit = 'minutes';
      suggestedDays = ['Mon', 'Wed', 'Fri'];
    } 
    // Rule 2: Underweight (BMI < 18.5) -> Muscle Hypertrophy & Strength building (Arms, Chest, Legs, Back)
    else if (calculatedBmi < 18.5) {
      protocolTitle = 'Muscle Hypertrophy & Strength Building';
      protocolBadge = 'CALORIC & MASS OVERLOAD';
      protocolSummary = 'Prescribing compound strength movements across chest, legs, back, and arms with controlled progressive resistance to stimulate lean mass accretion.';
      targetCategories = ['Chest', 'Legs', 'Back', 'Arms', 'Shoulders'];
      durationValue = 35;
      durationUnit = 'minutes';
      suggestedDays = ['Mon', 'Wed', 'Fri'];
    }
    // Rule 3: Normal Weight (BMI 18.5 - 24.9) -> Overall Fitness, Calisthenics & Core Maintenance
    else if (calculatedBmi < 25.0) {
      protocolTitle = 'Calisthenics, Strength & Core Conditioning';
      protocolBadge = 'OPTIMAL ATHLETIC ENDURANCE';
      protocolSummary = 'Balanced functional protocol combining bodyweight calisthenics, core stabilization, and lean hypertrophy for optimal power-to-weight performance.';
      targetCategories = ['Chest', 'Back', 'Abs', 'Legs', 'Arms', 'Shoulders'];
      durationValue = 30;
      durationUnit = 'minutes';
      suggestedDays = ['Mon', 'Wed', 'Fri'];
    } 
    // Rule 4: Overweight / Obese (BMI >= 25.0) -> Fat Loss, High-Calorie Burn & Low-Impact Cardio
    else {
      protocolTitle = 'Fat Loss, High-Calorie Burn & Joint-Friendly Movement';
      protocolBadge = 'METABOLIC FAT-BURN ACCELERATION';
      protocolSummary = 'Maximizing caloric expenditure and cardiovascular conditioning with joint-friendly movements (power walking, cycling, interval circuits) to accelerate fat loss.';
      targetCategories = ['Cardio', 'Abs', 'Legs'];
      durationValue = 45;
      durationUnit = 'seconds';
      suggestedDays = ['Tue', 'Thu', 'Sat'];
    }

    // Filter matching exercises from the catalog
    let matched = list.filter(item => {
      const cat = (item.category || '').toLowerCase();
      return targetCategories.some(tc => cat.includes(tc.toLowerCase()));
    });

    // If matches are few, fall back to the curated items matching the profile
    if (matched.length < 3) {
      matched = FALLBACK_WGER_EXERCISES.filter(item => {
        const cat = (item.category || '').toLowerCase();
        return targetCategories.some(tc => cat.includes(tc.toLowerCase()));
      });
    }

    // Pick 3 to 5 diverse exercises across categories
    const selected = [];
    const usedCategories = new Set();

    for (const ex of matched) {
      if (selected.length >= 4) break;
      if (!usedCategories.has(ex.category)) {
        selected.push(ex);
        usedCategories.add(ex.category);
      }
    }

    // If we still need more to reach at least 3, add remaining without duplicate IDs
    for (const ex of matched) {
      if (selected.length >= 4) break;
      if (!selected.some(s => s.id === ex.id)) {
        selected.push(ex);
      }
    }

    // Progressive Intensity Adaptation based on current program day
    const finalExercises = selected.map((ex) => {
      const isCardio = (ex.category || '').toLowerCase() === 'cardio';
      const isAbs = (ex.category || '').toLowerCase() === 'abs';

      let prescription = '';
      let targetDuration = durationValue;
      let targetUnit = durationUnit;

      if (progression.key === 'adaptation') {
        // Day 1 to 7 (Beginner / Adaptation Stage): Light volume (2-3 Sets × 8-10 Reps, light intensity)
        if (isCardio) {
          prescription = '15-20 Mins Light Aerobic Cadence';
          targetDuration = 20;
          targetUnit = 'minutes';
        } else if (isAbs) {
          prescription = '2-3 Sets × 30-45 Secs (Core Foundation)';
          targetDuration = 30;
          targetUnit = 'seconds';
        } else {
          prescription = '2-3 Sets × 8-10 Reps (Adaptation Load)';
          targetDuration = 20;
          targetUnit = 'minutes';
        }
      } else if (progression.key === 'building') {
        // Day 8 to 21 (Progressive Building Stage): Moderate volume (3-4 Sets × 10-12 Reps)
        if (isCardio) {
          prescription = '25-30 Mins Steady HIIT Intervals';
          targetDuration = 30;
          targetUnit = 'minutes';
        } else if (isAbs) {
          prescription = '3-4 Sets × 45-60 Secs (Endurance Hold)';
          targetDuration = 45;
          targetUnit = 'seconds';
        } else {
          prescription = '3-4 Sets × 10-12 Reps (Progressive Hypertrophy)';
          targetDuration = 30;
          targetUnit = 'minutes';
        }
      } else {
        // Day 22+ (Peak Conditioning Stage): Full volume progressive resistance targets
        if (isCardio) {
          prescription = '35-45 Mins High Tempo Circuit';
          targetDuration = 40;
          targetUnit = 'minutes';
        } else if (isAbs) {
          prescription = '4-5 Sets × 60 Secs (Peak Conditioning)';
          targetDuration = 60;
          targetUnit = 'seconds';
        } else {
          prescription = '4-5 Sets × 10-15 Reps (Full Resistance Volume)';
          targetDuration = 40;
          targetUnit = 'minutes';
        }
      }

      return {
        ...ex,
        durationValue: targetDuration,
        durationUnit: targetUnit,
        days: suggestedDays,
        prescription,
        intensityStage: progression.stageName,
        intensityBadge: progression.intensityLabel,
        intensityDesc: progression.intensityDesc,
        intensityColor: progression.color
      };
    });

    return {
      bmi: calculatedBmi,
      age: userAge,
      programDay: currentDay,
      totalDays,
      progression,
      protocolTitle,
      protocolBadge,
      protocolSummary,
      themeColor,
      exercises: finalExercises
    };
  }
}

export const wger = new WgerService();

