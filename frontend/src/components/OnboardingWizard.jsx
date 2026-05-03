import { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../hooks/useToast';

const POPULAR_EXERCISES = [
  { name: 'Bench Press', category: 'Chest', muscle_group: 'Pectorals', equipment: 'Barbell' },
  { name: 'Squat', category: 'Legs', muscle_group: 'Quadriceps', equipment: 'Barbell' },
  { name: 'Deadlift', category: 'Back', muscle_group: 'Lower Back, Hamstrings', equipment: 'Barbell' },
  { name: 'Pull-Up', category: 'Back', muscle_group: 'Latissimus Dorsi', equipment: 'Bodyweight' },
  { name: 'Overhead Press', category: 'Shoulders', muscle_group: 'Deltoids', equipment: 'Barbell' },
  { name: 'Barbell Row', category: 'Back', muscle_group: 'Rhomboids, Latissimus Dorsi', equipment: 'Barbell' },
  { name: 'Dumbbell Curl', category: 'Arms', muscle_group: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Tricep Pushdown', category: 'Arms', muscle_group: 'Triceps', equipment: 'Cable' },
  { name: 'Leg Press', category: 'Legs', muscle_group: 'Quadriceps, Glutes', equipment: 'Machine' },
  { name: 'Romanian Deadlift', category: 'Legs', muscle_group: 'Hamstrings, Glutes', equipment: 'Barbell' },
  { name: 'Incline Dumbbell Press', category: 'Chest', muscle_group: 'Pectorals', equipment: 'Dumbbell' },
  { name: 'Lateral Raise', category: 'Shoulders', muscle_group: 'Deltoids', equipment: 'Dumbbell' },
  { name: 'Plank', category: 'Core', muscle_group: 'Abs, Core', equipment: 'Bodyweight' },
  { name: 'Running', category: 'Cardio', muscle_group: 'Full Body', equipment: 'Bodyweight' },
  { name: 'Hip Thrust', category: 'Glutes', muscle_group: 'Glutes', equipment: 'Barbell' },
];

const GOAL_TYPES = [
  { value: 'workouts_per_week', label: 'Work out regularly (weekly)', icon: '🗓️' },
  { value: 'workouts_per_month', label: 'Work out regularly (monthly)', icon: '📅' },
  { value: 'volume_per_week', label: 'Build weekly volume', icon: '💪' },
];

const TOTAL_STEPS = 4;

export default function OnboardingWizard({ onComplete }) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — units
  const [weightUnit, setWeightUnit] = useState('kg');
  const [restTimer, setRestTimer] = useState(90);

  // Step 2 — exercises
  const [selectedExercises, setSelectedExercises] = useState(
    new Set(['Bench Press', 'Squat', 'Deadlift', 'Pull-Up', 'Overhead Press'])
  );

  // Step 3 — goal
  const [selectedGoal, setSelectedGoal] = useState('workouts_per_week');

  const toggleExercise = (name) => {
    setSelectedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Save unit preferences
      await api.put('/settings', { weight_unit: weightUnit, rest_timer_default: restTimer });

      // Add selected exercises in parallel
      const exercisesToAdd = POPULAR_EXERCISES.filter((e) => selectedExercises.has(e.name));
      await Promise.allSettled(
        exercisesToAdd.map((e) =>
          api.post('/exercises', {
            name: e.name,
            category: e.category,
            muscle_group: e.muscle_group,
            equipment: e.equipment,
          })
        )
      );

      // Create a starter goal
      if (selectedGoal) {
        await api.post('/goals', {
          goal_type: selectedGoal,
          target_value: selectedGoal === 'volume_per_week' ? 10000 : 3,
          period: 'weekly',
        }).catch(() => {});
      }

      // Mark onboarding complete
      await api.put('/auth/profile', { onboarding_completed: true });

      onComplete();
    } catch {
      addToast('Something went wrong during setup. You can always update these in Settings.', 'error');
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await api.put('/auth/profile', { onboarding_completed: true });
    } catch {
      // silently ignore — user can still use the app
    }
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-progress">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`onboarding-dot${i + 1 <= step ? ' active' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="onboarding-step">
            <h2>Welcome! Let&apos;s set up your preferences</h2>
            <p className="onboarding-sub">Quick setup so everything feels right from day one.</p>

            <div className="onboarding-field">
              <label>Weight unit</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={weightUnit === 'kg' ? 'toggle-btn active' : 'toggle-btn'}
                  onClick={() => setWeightUnit('kg')}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={weightUnit === 'lbs' ? 'toggle-btn active' : 'toggle-btn'}
                  onClick={() => setWeightUnit('lbs')}
                >
                  lbs
                </button>
              </div>
            </div>

            <div className="onboarding-field">
              <label>Default rest timer</label>
              <div className="toggle-group">
                {[60, 90, 120, 180].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={restTimer === s ? 'toggle-btn active' : 'toggle-btn'}
                    onClick={() => setRestTimer(s)}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>Pick your exercises</h2>
            <p className="onboarding-sub">Select the movements you train. You can always add more later.</p>
            <div className="onboarding-exercise-grid">
              {POPULAR_EXERCISES.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  className={`onboarding-exercise-pill${selectedExercises.has(ex.name) ? ' selected' : ''}`}
                  onClick={() => toggleExercise(ex.name)}
                >
                  <span className="pill-name">{ex.name}</span>
                  <span className="pill-cat">{ex.category}</span>
                </button>
              ))}
            </div>
            <p className="onboarding-hint">{selectedExercises.size} selected</p>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h2>What&apos;s your primary goal?</h2>
            <p className="onboarding-sub">We&apos;ll create a starter goal to track your progress.</p>
            <div className="onboarding-goal-list">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`onboarding-goal-item${selectedGoal === g.value ? ' selected' : ''}`}
                  onClick={() => setSelectedGoal(g.value)}
                >
                  <span className="goal-icon">{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step onboarding-final">
            <div className="onboarding-checkmark">✓</div>
            <h2>You&apos;re all set!</h2>
            <p className="onboarding-sub">
              Your exercises, preferences, and goal are ready. Start logging your first workout.
            </p>
            <ul className="onboarding-summary">
              <li>Weight unit: <strong>{weightUnit}</strong></li>
              <li>Rest timer: <strong>{restTimer}s</strong></li>
              <li>Exercises added: <strong>{selectedExercises.size}</strong></li>
              <li>Goal: <strong>{GOAL_TYPES.find((g) => g.value === selectedGoal)?.label}</strong></li>
            </ul>
          </div>
        )}

        <div className="onboarding-actions">
          {step < TOTAL_STEPS ? (
            <>
              <button type="button" className="ghost-btn" onClick={handleSkip}>
                Skip setup
              </button>
              <button type="button" className="primary-btn" onClick={() => setStep((s) => s + 1)}>
                {step === TOTAL_STEPS - 1 ? 'Review' : 'Next'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ghost-btn" onClick={() => setStep((s) => s - 1)}>
                ← Back
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleFinish}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting up…' : 'Start training'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
