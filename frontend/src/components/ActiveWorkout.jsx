import { useCallback, useEffect, useRef, useState } from 'react';

import api from '../api/client';
import RestTimer from './RestTimer';
import { getExerciseImageByName } from '../data/exerciseLibrary';
import { useToast } from '../hooks/useToast';

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveWorkout({ exercises, exerciseNameById, onFinish, onCancel }) {
  const { addToast } = useToast();
  const [sets, setSets] = useState([]);         // [{exercise_id, weight, reps, sets, done}]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef(null);
  const startedAtRef = useRef(new Date());

  // Start elapsed timer on mount
  useEffect(() => {
    startedAtRef.current = new Date();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const addExercise = (exerciseId) => {
    setSets((prev) => [...prev, { exercise_id: exerciseId, weight: '', reps: '', sets: '1', done: false }]);
  };

  const updateSet = (idx, key, val) => {
    setSets((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const markDone = (idx) => {
    setSets((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], done: true };
      return copy;
    });
    setShowRest(true);
    // Auto-advance to next undone set
    const nextUndone = sets.findIndex((s, i) => i > idx && !s.done);
    if (nextUndone >= 0) setCurrentIdx(nextUndone);
    else setCurrentIdx(idx + 1);
  };

  const completedCount = sets.filter((s) => s.done).length;
  const totalCount = sets.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const finishWorkout = useCallback(async () => {
    const doneSets = sets.filter((s) => s.done && s.exercise_id);
    if (doneSets.length === 0) {
      addToast('Complete at least one set before finishing.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        date: new Date().toISOString().slice(0, 10),
        duration_seconds: elapsed,
        sets: doneSets.map((s) => ({
          exercise_id: s.exercise_id,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 1,
          sets: Number(s.sets) || 1,
        })),
      };
      const res = await api.post('/workouts', payload);
      if (res.data.new_records?.length > 0) {
        res.data.new_records.forEach((r) => addToast(`🏆 PR! ${r.exercise_name}: ${r.record_type} → ${r.new_value}`, 'success'));
      }
      addToast('Workout completed!', 'success');
      onFinish?.();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save workout', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [sets, elapsed, addToast, onFinish]);

  return (
    <div className="active-workout fade-in">
      <div className="active-workout-header">
        <div>
          <h3>Active Workout</h3>
          <span className="timer-badge running">⏱ {formatElapsed(elapsed)}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="ghost-btn" style={{ width: 'auto' }} onClick={onCancel}>Cancel</button>
          <button type="button" style={{ width: 'auto' }} onClick={finishWorkout} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Finish Workout'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="active-progress-bar-wrap">
        <div className="active-progress-bar">
          <div className="active-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="active-progress-label">{completedCount}/{totalCount} sets — {pct}%</span>
      </div>

      {/* Add exercise selector */}
      <div className="active-add-exercise">
        <select onChange={(e) => { if (e.target.value) { addExercise(e.target.value); e.target.value = ''; } }}>
          <option value="">+ Add Exercise</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Set list */}
      <div className="active-set-list">
        {sets.map((s, idx) => {
          const name = exerciseNameById.get(s.exercise_id) || 'Exercise';
          const isCurrent = idx === currentIdx;
          return (
            <div key={idx} className={`active-set-card${s.done ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
              <img src={getExerciseImageByName(name)} alt={name} loading="lazy" />
              <div className="active-set-body">
                <strong>{name}</strong>
                <div className="active-set-inputs">
                  <input
                    type="number" step="0.5" min="0" placeholder="Weight"
                    value={s.weight} onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                    disabled={s.done}
                  />
                  <input
                    type="number" min="1" placeholder="Reps"
                    value={s.reps} onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                    disabled={s.done}
                  />
                  <input
                    type="number" min="1" placeholder="Sets"
                    value={s.sets} onChange={(e) => updateSet(idx, 'sets', e.target.value)}
                    disabled={s.done}
                  />
                  {!s.done ? (
                    <button type="button" onClick={() => markDone(idx)} style={{ width: 'auto' }}>✓ Done</button>
                  ) : (
                    <span className="chip" style={{ alignSelf: 'center' }}>✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sets.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
          Add exercises above to start your guided workout.
        </p>
      )}

      {allDone && totalCount > 0 && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <p style={{ color: 'var(--lime)', fontWeight: 700, fontSize: '1.1rem' }}>🎉 All sets complete!</p>
          <button type="button" onClick={finishWorkout} disabled={isSubmitting} style={{ maxWidth: '280px', margin: '0.5rem auto 0' }}>
            Finish & Save Workout
          </button>
        </div>
      )}

      {showRest && (
        <div className="active-rest-overlay">
          <RestTimer defaultSeconds={90} />
          <button type="button" className="ghost-btn" onClick={() => setShowRest(false)} style={{ width: 'auto', marginTop: '0.5rem' }}>
            Skip Rest
          </button>
        </div>
      )}
    </div>
  );
}
