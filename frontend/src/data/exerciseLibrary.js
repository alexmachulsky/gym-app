import armsImage from '../assets/photos/arms.jpg';
import backImage from '../assets/photos/back.jpg';
import cardioImage from '../assets/photos/cardio.jpg';
import chestImage from '../assets/photos/chest.jpg';
import coreImage from '../assets/photos/core.jpg';
import fullBodyImage from '../assets/photos/fullbody.jpg';
import glutesImage from '../assets/photos/glutes.jpg';
import legsImage from '../assets/photos/legs.jpg';
import mobilityImage from '../assets/photos/mobility.jpg';
import olympicImage from '../assets/photos/olympic.jpg';
import shouldersImage from '../assets/photos/shoulders.jpg';

const imageByCategory = {
  Chest: chestImage,
  Back: backImage,
  Legs: legsImage,
  Glutes: glutesImage,
  Calves: legsImage,
  Shoulders: shouldersImage,
  Arms: armsImage,
  Core: coreImage,
  'Full Body': fullBodyImage,
  Cardio: cardioImage,
  Olympic: olympicImage,
  Mobility: mobilityImage,
};

/** Pexels CDN helper — free license, no attribution required */
const pxl = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=338&fit=crop`;

/** Exercise-specific images from Pexels (keyed by exact exercise name) */
const imageByExercise = {
  // ── Chest ──
  'Bench Press':               pxl(3837757),
  'Incline Dumbbell Press':    pxl(3839310),
  'Decline Bench Press':       pxl(7289250),
  'Push-Up':                   pxl(14623739),
  'Weighted Dip':              pxl(4162488),
  'Cable Fly':                 pxl(32695897),
  'Pec Deck Machine':          pxl(3768913),
  'Machine Chest Press':       pxl(3838937),
  // ── Back ──
  'Pull-Up':                   pxl(4162478),
  'Chin-Up':                   pxl(7187872),
  'Lat Pulldown':              pxl(17210044),
  'Barbell Row':               pxl(4720780),
  'Single-Arm Dumbbell Row':   pxl(13088863),
  'Seated Cable Row':          pxl(16966340),
  'T-Bar Row':                 pxl(16966300),
  'Face Pull':                 pxl(5327503),
  // ── Legs ──
  'Back Squat':                pxl(28805366),
  'Front Squat':               pxl(1552249),
  'Leg Press':                 pxl(6844939),
  'Romanian Deadlift':         pxl(4853280),
  'Walking Lunge':             pxl(6339452),
  'Bulgarian Split Squat':     pxl(4853881),
  'Hack Squat':                pxl(5799855),
  'Leg Extension':             pxl(20379157),
  'Lying Leg Curl':            pxl(28731788),
  // ── Glutes ──
  'Hip Thrust':                pxl(4944004),
  'Barbell Glute Bridge':      pxl(36400032),
  'Cable Glute Kickback':      pxl(19659476),
  'Step-Up':                   pxl(4587384),
  'Sumo Deadlift':             pxl(13822300),
  'Curtsy Lunge':              pxl(30994841),
  // ── Calves ──
  'Standing Calf Raise':       pxl(31028213),
  'Seated Calf Raise':         pxl(13965339),
  'Donkey Calf Raise':         pxl(9152547),
  // ── Shoulders ──
  'Overhead Press':            pxl(14591561),
  'Arnold Press':              pxl(18060165),
  'Lateral Raise':             pxl(3837388),
  'Rear Delt Fly':             pxl(17210050),
  'Upright Row':               pxl(12890895),
  'Landmine Press':            pxl(7289370),
  // ── Arms ──
  'Barbell Curl':              pxl(4853329),
  'Hammer Curl':               pxl(3838389),
  'Preacher Curl':             pxl(14524650),
  'Cable Curl':                pxl(17210046),
  'Triceps Rope Pushdown':     pxl(5327498),
  'Skull Crusher':             pxl(3838698),
  'Close-Grip Bench Press':    pxl(3837781),
  'Overhead Triceps Extension': pxl(6388359),
  // ── Core ──
  'Plank':                     pxl(8769165),
  'Side Plank':                pxl(8436141),
  'Hanging Knee Raise':        pxl(4803714),
  'Hanging Leg Raise':         pxl(4803717),
  'Ab Wheel Rollout':          pxl(4164845),
  'Cable Crunch':              pxl(20379141),
  'Russian Twist':             pxl(5128466),
  'Pallof Press':              pxl(3931304),
  // ── Full Body ──
  'Deadlift':                  pxl(841125),
  'Kettlebell Swing':          pxl(622297),
  'Thruster':                  pxl(18187616),
  'Farmer Carry':              pxl(13318589),
  'Sled Push':                 pxl(32830368),
  'Burpee':                    pxl(7675405),
  'Turkish Get-Up':            pxl(33473318),
  'Renegade Row':              pxl(2247179),
  'Wall Ball':                 pxl(4720574),
  // ── Cardio ──
  'Treadmill Run':             pxl(4944970),
  'Incline Walk':              pxl(3888343),
  'Rowing Erg':                pxl(6389866),
  'Assault Bike':              pxl(6389076),
  'Jump Rope':                 pxl(6339602),
  'Stair Climber':             pxl(7880215),
  'Cycling Intervals':         pxl(8765704),
  'Sprint Intervals':          pxl(19787364),
  // ── Olympic ──
  'Power Clean':               pxl(1566414),
  'Clean and Jerk':            pxl(16966286),
  'Snatch':                    pxl(34237215),
  'Push Press':                pxl(1638336),
  'High Pull':                 pxl(7674492),
  // ── Mobility ──
  'Worlds Greatest Stretch':   pxl(3926934),
  'Thoracic Rotation Drill':   pxl(8413737),
  'Shoulder CARs':             pxl(27684617),
  'Ankle Dorsiflexion Drill':  pxl(897065),
  '90/90 Hip Switch':          pxl(4151129),
};

const catalog = [
  ['Bench Press', 'Chest', 'Chest, triceps, front delts', 'Intermediate', 'Primary horizontal press for upper-body strength.', 'barbell'],
  ['Incline Dumbbell Press', 'Chest', 'Upper chest, triceps', 'Intermediate', 'Strong upper-chest builder with unilateral control.', 'dumbbell'],
  ['Decline Bench Press', 'Chest', 'Lower chest, triceps', 'Intermediate', 'Biases lower chest pressing mechanics.', 'barbell'],
  ['Push-Up', 'Chest', 'Chest, triceps, core', 'Beginner', 'Foundational bodyweight press with scalable difficulty.', 'bodyweight'],
  ['Weighted Dip', 'Chest', 'Lower chest, triceps, shoulders', 'Advanced', 'Heavy compound movement for pressing power.', 'bodyweight'],
  ['Cable Fly', 'Chest', 'Chest, front delts', 'Beginner', 'Constant tension chest isolation movement.', 'cable'],
  ['Pec Deck Machine', 'Chest', 'Chest', 'Beginner', 'Stable isolation pattern for chest hypertrophy.', 'machine'],
  ['Machine Chest Press', 'Chest', 'Chest, triceps', 'Beginner', 'Controlled pressing pattern for volume work.', 'machine'],

  ['Pull-Up', 'Back', 'Lats, upper back, biceps', 'Intermediate', 'Bodyweight vertical pull for back width.', 'bodyweight'],
  ['Chin-Up', 'Back', 'Lats, biceps', 'Intermediate', 'Supinated vertical pull with high biceps demand.', 'bodyweight'],
  ['Lat Pulldown', 'Back', 'Lats, upper back', 'Beginner', 'Machine-based vertical pulling movement.', 'machine'],
  ['Barbell Row', 'Back', 'Mid-back, lats, rear delts', 'Intermediate', 'Foundational horizontal row for thickness.', 'barbell'],
  ['Single-Arm Dumbbell Row', 'Back', 'Lats, mid-back', 'Beginner', 'Unilateral row improving scapular control.', 'dumbbell'],
  ['Seated Cable Row', 'Back', 'Mid-back, rhomboids', 'Beginner', 'Stable row pattern with constant resistance.', 'cable'],
  ['T-Bar Row', 'Back', 'Mid-back, lats', 'Intermediate', 'Heavy supported row for back density.', 'barbell'],
  ['Face Pull', 'Back', 'Rear delts, upper back, rotator cuff', 'Beginner', 'Posture and shoulder health movement.', 'cable'],

  ['Back Squat', 'Legs', 'Quads, glutes, core', 'Intermediate', 'Primary lower-body strength lift.', 'barbell'],
  ['Front Squat', 'Legs', 'Quads, core, upper back', 'Intermediate', 'Upright squat variation with quad focus.', 'barbell'],
  ['Leg Press', 'Legs', 'Quads, glutes', 'Beginner', 'Machine compound for lower-body volume.', 'machine'],
  ['Romanian Deadlift', 'Legs', 'Hamstrings, glutes, lower back', 'Intermediate', 'Hip hinge for posterior chain development.', 'barbell'],
  ['Walking Lunge', 'Legs', 'Quads, glutes, adductors', 'Beginner', 'Unilateral lower-body pattern and balance.', 'bodyweight'],
  ['Bulgarian Split Squat', 'Legs', 'Quads, glutes', 'Intermediate', 'High-intensity unilateral leg strength movement.', 'dumbbell'],
  ['Hack Squat', 'Legs', 'Quads, glutes', 'Intermediate', 'Machine squat variant for quad loading.', 'machine'],
  ['Leg Extension', 'Legs', 'Quads', 'Beginner', 'Isolation movement for quads.', 'machine'],
  ['Lying Leg Curl', 'Legs', 'Hamstrings', 'Beginner', 'Hamstring isolation movement.', 'machine'],

  ['Hip Thrust', 'Glutes', 'Glutes, hamstrings', 'Intermediate', 'Top-tier glute strength and hypertrophy lift.', 'barbell'],
  ['Barbell Glute Bridge', 'Glutes', 'Glutes, hamstrings', 'Beginner', 'Horizontal hip extension with reduced range.', 'barbell'],
  ['Cable Glute Kickback', 'Glutes', 'Glutes', 'Beginner', 'Isolation movement for glute activation.', 'cable'],
  ['Step-Up', 'Glutes', 'Glutes, quads', 'Beginner', 'Unilateral strength and functional power.', 'dumbbell'],
  ['Sumo Deadlift', 'Glutes', 'Glutes, adductors, posterior chain', 'Intermediate', 'Wider-stance deadlift emphasizing hips.', 'barbell'],
  ['Curtsy Lunge', 'Glutes', 'Glute medius, quads', 'Beginner', 'Frontal/transverse-plane lower body control.', 'bodyweight'],

  ['Standing Calf Raise', 'Calves', 'Gastrocnemius', 'Beginner', 'Primary movement for calf strength.', 'machine'],
  ['Seated Calf Raise', 'Calves', 'Soleus', 'Beginner', 'Targets deeper calf musculature.', 'machine'],
  ['Donkey Calf Raise', 'Calves', 'Calves', 'Intermediate', 'High-stretch calf variation.', 'machine'],

  ['Overhead Press', 'Shoulders', 'Shoulders, triceps, upper chest', 'Intermediate', 'Vertical press for upper-body strength.', 'barbell'],
  ['Arnold Press', 'Shoulders', 'Delts, triceps', 'Intermediate', 'Rotational dumbbell press for shoulder volume.', 'dumbbell'],
  ['Lateral Raise', 'Shoulders', 'Side delts', 'Beginner', 'Isolation movement for shoulder width.', 'dumbbell'],
  ['Rear Delt Fly', 'Shoulders', 'Rear delts, upper back', 'Beginner', 'Balances pressing-dominant training.', 'dumbbell'],
  ['Upright Row', 'Shoulders', 'Delts, traps', 'Intermediate', 'Pulling pattern targeting shoulders/traps.', 'barbell'],
  ['Landmine Press', 'Shoulders', 'Delts, triceps, upper chest', 'Beginner', 'Joint-friendly angled pressing movement.', 'barbell'],

  ['Barbell Curl', 'Arms', 'Biceps, forearms', 'Beginner', 'Classic elbow-flexion strength movement.', 'barbell'],
  ['Hammer Curl', 'Arms', 'Biceps brachialis, forearms', 'Beginner', 'Neutral-grip arm builder.', 'dumbbell'],
  ['Preacher Curl', 'Arms', 'Biceps', 'Intermediate', 'Strict biceps isolation with reduced momentum.', 'dumbbell'],
  ['Cable Curl', 'Arms', 'Biceps', 'Beginner', 'Constant-tension biceps work.', 'cable'],
  ['Triceps Rope Pushdown', 'Arms', 'Triceps', 'Beginner', 'Cable extension for lockout strength.', 'cable'],
  ['Skull Crusher', 'Arms', 'Triceps', 'Intermediate', 'Overhead elbow extension variation.', 'barbell'],
  ['Close-Grip Bench Press', 'Arms', 'Triceps, chest', 'Intermediate', 'Heavy triceps-focused press.', 'barbell'],
  ['Overhead Triceps Extension', 'Arms', 'Triceps long head', 'Beginner', 'Stretch-focused triceps isolation.', 'dumbbell'],

  ['Plank', 'Core', 'Abdominals, obliques, glutes', 'Beginner', 'Isometric trunk stability drill.', 'bodyweight'],
  ['Side Plank', 'Core', 'Obliques, glute medius', 'Beginner', 'Lateral core stabilization movement.', 'bodyweight'],
  ['Hanging Knee Raise', 'Core', 'Lower abs, hip flexors', 'Intermediate', 'Dynamic hanging core control.', 'bodyweight'],
  ['Hanging Leg Raise', 'Core', 'Lower abs, hip flexors', 'Advanced', 'Higher-skill hanging abdominal movement.', 'bodyweight'],
  ['Ab Wheel Rollout', 'Core', 'Anterior core, lats', 'Intermediate', 'Anti-extension core strength movement.', 'bodyweight'],
  ['Cable Crunch', 'Core', 'Rectus abdominis', 'Beginner', 'Weighted spinal flexion for ab hypertrophy.', 'cable'],
  ['Russian Twist', 'Core', 'Obliques, deep core', 'Beginner', 'Rotational control movement.', 'bodyweight'],
  ['Pallof Press', 'Core', 'Anti-rotation core, obliques', 'Beginner', 'Core bracing against rotational forces.', 'cable'],

  ['Deadlift', 'Full Body', 'Posterior chain, grip, core', 'Intermediate', 'Global strength and force production lift.', 'barbell'],
  ['Kettlebell Swing', 'Full Body', 'Hips, glutes, hamstrings, core', 'Intermediate', 'Explosive hinge for power and conditioning.', 'kettlebell'],
  ['Thruster', 'Full Body', 'Legs, shoulders, core', 'Intermediate', 'Squat-to-press metabolic movement.', 'barbell'],
  ['Farmer Carry', 'Full Body', 'Grip, traps, core, legs', 'Beginner', 'Loaded carry for total-body stability.', 'dumbbell'],
  ['Sled Push', 'Full Body', 'Legs, conditioning, core', 'Beginner', 'High-output concentric conditioning tool.', 'machine'],
  ['Burpee', 'Full Body', 'Full body, conditioning', 'Intermediate', 'High-intensity bodyweight movement.', 'bodyweight'],
  ['Turkish Get-Up', 'Full Body', 'Shoulders, core, hips', 'Advanced', 'Complex movement for mobility and control.', 'kettlebell'],
  ['Renegade Row', 'Full Body', 'Back, core, arms', 'Intermediate', 'Anti-rotation row with plank stability.', 'dumbbell'],
  ['Wall Ball', 'Full Body', 'Legs, shoulders, conditioning', 'Beginner', 'Explosive squat and throw pattern.', 'bodyweight'],

  ['Treadmill Run', 'Cardio', 'Cardiovascular system, legs', 'Beginner', 'Foundational aerobic/anaerobic endurance work.', 'machine'],
  ['Incline Walk', 'Cardio', 'Cardio, calves, glutes', 'Beginner', 'Low-impact steady-state conditioning.', 'machine'],
  ['Rowing Erg', 'Cardio', 'Back, legs, cardio', 'Beginner', 'Low-impact full-body endurance training.', 'machine'],
  ['Assault Bike', 'Cardio', 'Cardio, full body', 'Intermediate', 'High-intensity interval conditioning.', 'machine'],
  ['Jump Rope', 'Cardio', 'Calves, coordination, cardio', 'Beginner', 'Simple and effective conditioning tool.', 'bodyweight'],
  ['Stair Climber', 'Cardio', 'Cardio, glutes, calves', 'Beginner', 'Continuous step-based conditioning.', 'machine'],
  ['Cycling Intervals', 'Cardio', 'Cardio, quads', 'Intermediate', 'Structured interval training for power and endurance.', 'machine'],
  ['Sprint Intervals', 'Cardio', 'Power, cardio, speed', 'Advanced', 'Max-effort running interval protocol.', 'bodyweight'],

  ['Power Clean', 'Olympic', 'Posterior chain, traps, power', 'Advanced', 'Explosive pull and catch movement.', 'barbell'],
  ['Clean and Jerk', 'Olympic', 'Full body power and coordination', 'Advanced', 'Two-part olympic competition lift.', 'barbell'],
  ['Snatch', 'Olympic', 'Full body speed and mobility', 'Advanced', 'Single-motion olympic competition lift.', 'barbell'],
  ['Push Press', 'Olympic', 'Shoulders, triceps, power', 'Intermediate', 'Dip-drive overhead pressing movement.', 'barbell'],
  ['High Pull', 'Olympic', 'Traps, posterior chain', 'Intermediate', 'Explosive pull for speed-strength development.', 'barbell'],

  ['Worlds Greatest Stretch', 'Mobility', 'Hips, thoracic spine, hamstrings', 'Beginner', 'Dynamic full-body mobility sequence.', 'bodyweight'],
  ['Thoracic Rotation Drill', 'Mobility', 'T-spine, shoulders', 'Beginner', 'Improves thoracic extension and rotation.', 'bodyweight'],
  ['Shoulder CARs', 'Mobility', 'Shoulders, scapular control', 'Beginner', 'Controlled articular shoulder rotations.', 'bodyweight'],
  ['Ankle Dorsiflexion Drill', 'Mobility', 'Ankles, calves', 'Beginner', 'Improves squat and lunge mechanics.', 'bodyweight'],
  ['90/90 Hip Switch', 'Mobility', 'Hips, glutes', 'Beginner', 'Hip internal/external rotation control.', 'bodyweight'],
];

export const EXERCISE_LIBRARY = catalog.map(([name, category, focus, difficulty, description, equipment]) => ({
  name,
  category,
  focus,
  difficulty,
  description,
  equipment,
  image: imageByExercise[name] || imageByCategory[category] || fullBodyImage,
}));

export const LIBRARY_CATEGORIES = ['All', ...Object.keys(imageByCategory)];

export const EQUIPMENT_TYPES = ['All', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands'];

/** Stretch / warm-up suggestions keyed by muscle category */
export const STRETCH_SUGGESTIONS = {
  Chest:     ['Doorway Pec Stretch (30s each side)', 'Arm Circles (20 reps)', 'Band Pull-Apart (15 reps)'],
  Back:      ['Cat-Cow Stretch (10 reps)', 'Child\'s Pose (30s)', 'Thoracic Rotation Drill (8 each side)'],
  Legs:      ['World\'s Greatest Stretch (5 each side)', 'Bodyweight Squat (15 reps)', 'Leg Swing (10 each leg)'],
  Glutes:    ['90/90 Hip Switch (8 each side)', 'Pigeon Stretch (30s each)', 'Glute Bridge (15 reps)'],
  Shoulders: ['Shoulder CARs (5 each arm)', 'Band Pull-Apart (15 reps)', 'Wall Slide (10 reps)'],
  Arms:      ['Wrist Circles (10 each)', 'Banded Bicep Curl (10 reps light)', 'Tricep Wall Stretch (20s each)'],
  Core:      ['Dead Bug (10 reps)', 'Cat-Cow Stretch (10 reps)', 'Side-Lying Windmill (5 each side)'],
  'Full Body': ['World\'s Greatest Stretch (5 each)', 'Inchworm (8 reps)', 'Jumping Jacks (30s)'],
  Cardio:    ['Ankle Dorsiflexion Drill (10 each)', 'Leg Swing (10 each)', 'High Knees (20s)'],
  Olympic:   ['World\'s Greatest Stretch (5 each)', 'Overhead Squat w/ PVC (8 reps)', 'Hip CARs (5 each)'],
  Mobility:  [],
};

export function getStretchSuggestionsForExercises(exerciseNames) {
  const categories = new Set();
  for (const name of exerciseNames) {
    const entry = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === name.trim().toLowerCase());
    if (entry) categories.add(entry.category);
  }
  const suggestions = new Set();
  for (const cat of categories) {
    (STRETCH_SUGGESTIONS[cat] || []).forEach((s) => suggestions.add(s));
  }
  return [...suggestions];
}

export function getExerciseImageByName(exerciseName) {
  const lowerName = exerciseName.trim().toLowerCase();
  const fromLibrary = EXERCISE_LIBRARY.find((exercise) => exercise.name.toLowerCase() === lowerName);
  if (fromLibrary) return fromLibrary.image;

  if (lowerName.includes('press') || lowerName.includes('dip') || lowerName.includes('fly')) return chestImage;
  if (lowerName.includes('row') || lowerName.includes('pull') || lowerName.includes('lat')) return backImage;
  if (lowerName.includes('squat') || lowerName.includes('lunge') || lowerName.includes('leg press')) return legsImage;
  if (lowerName.includes('hip thrust') || lowerName.includes('glute')) return glutesImage;
  if (lowerName.includes('calf')) return legsImage;
  if (lowerName.includes('curl') || lowerName.includes('triceps') || lowerName.includes('biceps')) return armsImage;
  if (lowerName.includes('plank') || lowerName.includes('crunch') || lowerName.includes('core') || lowerName.includes('ab')) return coreImage;
  if (lowerName.includes('run') || lowerName.includes('bike') || lowerName.includes('jump rope') || lowerName.includes('cardio')) return cardioImage;
  if (lowerName.includes('clean') || lowerName.includes('snatch') || lowerName.includes('jerk') || lowerName.includes('high pull')) return olympicImage;
  if (lowerName.includes('mobility') || lowerName.includes('stretch') || lowerName.includes('rotation')) return mobilityImage;

  return fullBodyImage;
}
