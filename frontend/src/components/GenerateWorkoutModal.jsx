import { useState } from 'react';

import api from '../api/client';
import { useToast } from '../hooks/useToast';

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Legs', 'Glutes', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Calves',
];

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands',
];

export default function GenerateWorkoutModal({ onUse, onClose }) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [duration, setDuration] = useState(60);
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleItem = (list, setList, item) => {
    setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
  };

  const generate = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/workouts/generate', {
        muscle_groups: muscleGroups,
        equipment: equipment.length > 0 ? equipment : null,
        difficulty,
        target_duration_minutes: duration,
      });
      setSuggestions(res.data.suggested_sets);
      setStep(4);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to generate workout', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const useWorkout = () => {
    if (suggestions && onUse) onUse(suggestions);
    onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-box generate-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">Generate Workout</h3>

        {step === 1 && (
          <div className="gen-step">
            <p className="dialog-message">Select target muscle groups</p>
            <div className="gen-chip-grid">
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  className={`gen-chip${muscleGroups.includes(mg) ? ' gen-chip-active' : ''}`}
                  onClick={() => toggleItem(muscleGroups, setMuscleGroups, mg)}
                >
                  {mg}
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
              <button type="button" disabled={muscleGroups.length === 0} onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="gen-step">
            <p className="dialog-message">Select available equipment (optional)</p>
            <div className="gen-chip-grid">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  className={`gen-chip${equipment.includes(eq) ? ' gen-chip-active' : ''}`}
                  onClick={() => toggleItem(equipment, setEquipment, eq)}
                >
                  {eq}
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" className="ghost-btn" onClick={() => setStep(1)}>Back</button>
              <button type="button" onClick={() => setStep(3)}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="gen-step">
            <p className="dialog-message">Difficulty &amp; Duration</p>
            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Difficulty
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Target Duration (minutes)
                <input type="number" min="15" max="180" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </label>
            </div>
            <div className="dialog-actions">
              <button type="button" className="ghost-btn" onClick={() => setStep(2)}>Back</button>
              <button type="button" disabled={isLoading} onClick={generate}>
                {isLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && suggestions && (
          <div className="gen-step">
            <p className="dialog-message">Generated {suggestions.length} exercises</p>
            <ul className="gen-result-list">
              {suggestions.map((s, i) => (
                <li key={i} className="gen-result-item">
                  <strong>{s.exercise_name}</strong>
                  <span>{s.weight ? `${s.weight} kg` : '–'} × {s.reps} reps × {s.sets} sets</span>
                </li>
              ))}
            </ul>
            <div className="dialog-actions">
              <button type="button" className="ghost-btn" onClick={() => { setSuggestions(null); setStep(1); }}>Regenerate</button>
              <button type="button" onClick={useWorkout}>Use This Workout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
