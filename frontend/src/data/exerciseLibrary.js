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

const catalog = [
  ['Bench Press', 'Chest', 'Chest, triceps, front delts', 'Intermediate', 'Primary horizontal press for upper-body strength.'],
  ['Incline Dumbbell Press', 'Chest', 'Upper chest, triceps', 'Intermediate', 'Strong upper-chest builder with unilateral control.'],
  ['Decline Bench Press', 'Chest', 'Lower chest, triceps', 'Intermediate', 'Biases lower chest pressing mechanics.'],
  ['Push-Up', 'Chest', 'Chest, triceps, core', 'Beginner', 'Foundational bodyweight press with scalable difficulty.'],
  ['Weighted Dip', 'Chest', 'Lower chest, triceps, shoulders', 'Advanced', 'Heavy compound movement for pressing power.'],
  ['Cable Fly', 'Chest', 'Chest, front delts', 'Beginner', 'Constant tension chest isolation movement.'],
  ['Pec Deck Machine', 'Chest', 'Chest', 'Beginner', 'Stable isolation pattern for chest hypertrophy.'],
  ['Machine Chest Press', 'Chest', 'Chest, triceps', 'Beginner', 'Controlled pressing pattern for volume work.'],

  ['Pull-Up', 'Back', 'Lats, upper back, biceps', 'Intermediate', 'Bodyweight vertical pull for back width.'],
  ['Chin-Up', 'Back', 'Lats, biceps', 'Intermediate', 'Supinated vertical pull with high biceps demand.'],
  ['Lat Pulldown', 'Back', 'Lats, upper back', 'Beginner', 'Machine-based vertical pulling movement.'],
  ['Barbell Row', 'Back', 'Mid-back, lats, rear delts', 'Intermediate', 'Foundational horizontal row for thickness.'],
  ['Single-Arm Dumbbell Row', 'Back', 'Lats, mid-back', 'Beginner', 'Unilateral row improving scapular control.'],
  ['Seated Cable Row', 'Back', 'Mid-back, rhomboids', 'Beginner', 'Stable row pattern with constant resistance.'],
  ['T-Bar Row', 'Back', 'Mid-back, lats', 'Intermediate', 'Heavy supported row for back density.'],
  ['Face Pull', 'Back', 'Rear delts, upper back, rotator cuff', 'Beginner', 'Posture and shoulder health movement.'],

  ['Back Squat', 'Legs', 'Quads, glutes, core', 'Intermediate', 'Primary lower-body strength lift.'],
  ['Front Squat', 'Legs', 'Quads, core, upper back', 'Intermediate', 'Upright squat variation with quad focus.'],
  ['Leg Press', 'Legs', 'Quads, glutes', 'Beginner', 'Machine compound for lower-body volume.'],
  ['Romanian Deadlift', 'Legs', 'Hamstrings, glutes, lower back', 'Intermediate', 'Hip hinge for posterior chain development.'],
  ['Walking Lunge', 'Legs', 'Quads, glutes, adductors', 'Beginner', 'Unilateral lower-body pattern and balance.'],
  ['Bulgarian Split Squat', 'Legs', 'Quads, glutes', 'Intermediate', 'High-intensity unilateral leg strength movement.'],
  ['Hack Squat', 'Legs', 'Quads, glutes', 'Intermediate', 'Machine squat variant for quad loading.'],
  ['Leg Extension', 'Legs', 'Quads', 'Beginner', 'Isolation movement for quads.'],
  ['Lying Leg Curl', 'Legs', 'Hamstrings', 'Beginner', 'Hamstring isolation movement.'],

  ['Hip Thrust', 'Glutes', 'Glutes, hamstrings', 'Intermediate', 'Top-tier glute strength and hypertrophy lift.'],
  ['Barbell Glute Bridge', 'Glutes', 'Glutes, hamstrings', 'Beginner', 'Horizontal hip extension with reduced range.'],
  ['Cable Glute Kickback', 'Glutes', 'Glutes', 'Beginner', 'Isolation movement for glute activation.'],
  ['Step-Up', 'Glutes', 'Glutes, quads', 'Beginner', 'Unilateral strength and functional power.'],
  ['Sumo Deadlift', 'Glutes', 'Glutes, adductors, posterior chain', 'Intermediate', 'Wider-stance deadlift emphasizing hips.'],
  ['Curtsy Lunge', 'Glutes', 'Glute medius, quads', 'Beginner', 'Frontal/transverse-plane lower body control.'],

  ['Standing Calf Raise', 'Calves', 'Gastrocnemius', 'Beginner', 'Primary movement for calf strength.'],
  ['Seated Calf Raise', 'Calves', 'Soleus', 'Beginner', 'Targets deeper calf musculature.'],
  ['Donkey Calf Raise', 'Calves', 'Calves', 'Intermediate', 'High-stretch calf variation.'],

  ['Overhead Press', 'Shoulders', 'Shoulders, triceps, upper chest', 'Intermediate', 'Vertical press for upper-body strength.'],
  ['Arnold Press', 'Shoulders', 'Delts, triceps', 'Intermediate', 'Rotational dumbbell press for shoulder volume.'],
  ['Lateral Raise', 'Shoulders', 'Side delts', 'Beginner', 'Isolation movement for shoulder width.'],
  ['Rear Delt Fly', 'Shoulders', 'Rear delts, upper back', 'Beginner', 'Balances pressing-dominant training.'],
  ['Upright Row', 'Shoulders', 'Delts, traps', 'Intermediate', 'Pulling pattern targeting shoulders/traps.'],
  ['Landmine Press', 'Shoulders', 'Delts, triceps, upper chest', 'Beginner', 'Joint-friendly angled pressing movement.'],

  ['Barbell Curl', 'Arms', 'Biceps, forearms', 'Beginner', 'Classic elbow-flexion strength movement.'],
  ['Hammer Curl', 'Arms', 'Biceps brachialis, forearms', 'Beginner', 'Neutral-grip arm builder.'],
  ['Preacher Curl', 'Arms', 'Biceps', 'Intermediate', 'Strict biceps isolation with reduced momentum.'],
  ['Cable Curl', 'Arms', 'Biceps', 'Beginner', 'Constant-tension biceps work.'],
  ['Triceps Rope Pushdown', 'Arms', 'Triceps', 'Beginner', 'Cable extension for lockout strength.'],
  ['Skull Crusher', 'Arms', 'Triceps', 'Intermediate', 'Overhead elbow extension variation.'],
  ['Close-Grip Bench Press', 'Arms', 'Triceps, chest', 'Intermediate', 'Heavy triceps-focused press.'],
  ['Overhead Triceps Extension', 'Arms', 'Triceps long head', 'Beginner', 'Stretch-focused triceps isolation.'],

  ['Plank', 'Core', 'Abdominals, obliques, glutes', 'Beginner', 'Isometric trunk stability drill.'],
  ['Side Plank', 'Core', 'Obliques, glute medius', 'Beginner', 'Lateral core stabilization movement.'],
  ['Hanging Knee Raise', 'Core', 'Lower abs, hip flexors', 'Intermediate', 'Dynamic hanging core control.'],
  ['Hanging Leg Raise', 'Core', 'Lower abs, hip flexors', 'Advanced', 'Higher-skill hanging abdominal movement.'],
  ['Ab Wheel Rollout', 'Core', 'Anterior core, lats', 'Intermediate', 'Anti-extension core strength movement.'],
  ['Cable Crunch', 'Core', 'Rectus abdominis', 'Beginner', 'Weighted spinal flexion for ab hypertrophy.'],
  ['Russian Twist', 'Core', 'Obliques, deep core', 'Beginner', 'Rotational control movement.'],
  ['Pallof Press', 'Core', 'Anti-rotation core, obliques', 'Beginner', 'Core bracing against rotational forces.'],

  ['Deadlift', 'Full Body', 'Posterior chain, grip, core', 'Intermediate', 'Global strength and force production lift.'],
  ['Kettlebell Swing', 'Full Body', 'Hips, glutes, hamstrings, core', 'Intermediate', 'Explosive hinge for power and conditioning.'],
  ['Thruster', 'Full Body', 'Legs, shoulders, core', 'Intermediate', 'Squat-to-press metabolic movement.'],
  ['Farmer Carry', 'Full Body', 'Grip, traps, core, legs', 'Beginner', 'Loaded carry for total-body stability.'],
  ['Sled Push', 'Full Body', 'Legs, conditioning, core', 'Beginner', 'High-output concentric conditioning tool.'],
  ['Burpee', 'Full Body', 'Full body, conditioning', 'Intermediate', 'High-intensity bodyweight movement.'],
  ['Turkish Get-Up', 'Full Body', 'Shoulders, core, hips', 'Advanced', 'Complex movement for mobility and control.'],
  ['Renegade Row', 'Full Body', 'Back, core, arms', 'Intermediate', 'Anti-rotation row with plank stability.'],
  ['Wall Ball', 'Full Body', 'Legs, shoulders, conditioning', 'Beginner', 'Explosive squat and throw pattern.'],

  ['Treadmill Run', 'Cardio', 'Cardiovascular system, legs', 'Beginner', 'Foundational aerobic/anaerobic endurance work.'],
  ['Incline Walk', 'Cardio', 'Cardio, calves, glutes', 'Beginner', 'Low-impact steady-state conditioning.'],
  ['Rowing Erg', 'Cardio', 'Back, legs, cardio', 'Beginner', 'Low-impact full-body endurance training.'],
  ['Assault Bike', 'Cardio', 'Cardio, full body', 'Intermediate', 'High-intensity interval conditioning.'],
  ['Jump Rope', 'Cardio', 'Calves, coordination, cardio', 'Beginner', 'Simple and effective conditioning tool.'],
  ['Stair Climber', 'Cardio', 'Cardio, glutes, calves', 'Beginner', 'Continuous step-based conditioning.'],
  ['Cycling Intervals', 'Cardio', 'Cardio, quads', 'Intermediate', 'Structured interval training for power and endurance.'],
  ['Sprint Intervals', 'Cardio', 'Power, cardio, speed', 'Advanced', 'Max-effort running interval protocol.'],

  ['Power Clean', 'Olympic', 'Posterior chain, traps, power', 'Advanced', 'Explosive pull and catch movement.'],
  ['Clean and Jerk', 'Olympic', 'Full body power and coordination', 'Advanced', 'Two-part olympic competition lift.'],
  ['Snatch', 'Olympic', 'Full body speed and mobility', 'Advanced', 'Single-motion olympic competition lift.'],
  ['Push Press', 'Olympic', 'Shoulders, triceps, power', 'Intermediate', 'Dip-drive overhead pressing movement.'],
  ['High Pull', 'Olympic', 'Traps, posterior chain', 'Intermediate', 'Explosive pull for speed-strength development.'],

  ['Worlds Greatest Stretch', 'Mobility', 'Hips, thoracic spine, hamstrings', 'Beginner', 'Dynamic full-body mobility sequence.'],
  ['Thoracic Rotation Drill', 'Mobility', 'T-spine, shoulders', 'Beginner', 'Improves thoracic extension and rotation.'],
  ['Shoulder CARs', 'Mobility', 'Shoulders, scapular control', 'Beginner', 'Controlled articular shoulder rotations.'],
  ['Ankle Dorsiflexion Drill', 'Mobility', 'Ankles, calves', 'Beginner', 'Improves squat and lunge mechanics.'],
  ['90/90 Hip Switch', 'Mobility', 'Hips, glutes', 'Beginner', 'Hip internal/external rotation control.'],
];

export const EXERCISE_LIBRARY = catalog.map(([name, category, focus, difficulty, description]) => ({
  name,
  category,
  focus,
  difficulty,
  description,
  image: imageByCategory[category] || fullBodyImage,
}));

export const LIBRARY_CATEGORIES = ['All', ...Object.keys(imageByCategory)];

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
