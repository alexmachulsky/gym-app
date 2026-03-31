import { useEffect, useMemo, useState } from 'react';

import api from '../api/client';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { getExerciseImageByName } from '../data/exerciseLibrary';
import { useToast } from '../hooks/useToast';

const makeSetRow = () => ({ exercise_id: '', weight: '', reps: '', sets: '' });

function calculateTotalVolume(workouts) {
  return workouts.reduce((total, workout) => {
    const workoutVolume = workout.sets.reduce((setTotal, setItem) => {
      return setTotal + Number(setItem.weight) * Number(setItem.reps) * Number(setItem.sets);
    }, 0);
    return total + workoutVolume;
  }, 0);
}

export default function WorkoutsPage() {
  const { addToast } = useToast();
  const [workoutDate, setWorkoutDate] = useState('');
  const [dateTouched, setDateTouched] = useState(false);
  const [rows, setRows] = useState([makeSetRow()]);
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const dateError = dateTouched && workoutDate && workoutDate > new Date().toISOString().slice(0, 10)
    ? 'Workout date cannot be in the future'
    : '';

  const exerciseNameById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
    [exercises]
  );

  const metrics = useMemo(() => {
    const totalSessions = workouts.length;
    const totalSets = workouts.reduce((total, workout) => total + workout.sets.length, 0);
    const totalVolume = calculateTotalVolume(workouts);

    return {
      totalSessions,
      totalSets,
      totalVolume: Math.round(totalVolume),
    };
  }, [workouts]);

  const loadData = async () => {
    const [exerciseRes, workoutRes] = await Promise.all([api.get('/exercises'), api.get('/workouts')]);
    setExercises(exerciseRes.data);
    setWorkouts(workoutRes.data);
  };

  useEffect(() => {
    loadData().catch(() => addToast('Failed to load workout data', 'error'));
  }, []);

  const updateRow = (index, key, value) => {
    const clone = [...rows];
    clone[index][key] = value;
    setRows(clone);
  };

  const addRow = () => setRows((prev) => [...prev, makeSetRow()]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const createWorkout = async (event) => {
    event.preventDefault();
    setDateTouched(true);
    if (dateError || (workoutDate > new Date().toISOString().slice(0, 10))) return;
    setIsSubmitting(true);

    const payload = {
      date: workoutDate,
      sets: rows.map((row) => ({
        exercise_id: row.exercise_id,
        weight: Number(row.weight),
        reps: Number(row.reps),
        sets: Number(row.sets),
      })),
    };

    try {
      await api.post('/workouts', payload);
      setRows([makeSetRow()]);
      setWorkoutDate('');
      await loadData();
      addToast('Workout logged successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create workout', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteWorkout = async (id) => {
    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      addToast('Workout deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete workout', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Workout Log</h2>
        <p>Capture sessions with set-level detail and watch total workload build over time.</p>
      </div>

      <div className="stats-grid">
        <article className="stat-card stagger-item">
          <h3>Sessions</h3>
          <p>{metrics.totalSessions}</p>
        </article>
        <article className="stat-card stagger-item">
          <h3>Total Sets</h3>
          <p>{metrics.totalSets}</p>
        </article>
        <article className="stat-card stagger-item">
          <h3>Total Volume</h3>
          <p>{metrics.totalVolume.toLocaleString()}</p>
        </article>
      </div>

      <form className="workout-form" onSubmit={createWorkout}>
        <label>
          Workout Date
          <input
            type="date"
            value={workoutDate}
            className={dateError ? 'invalid' : ''}
            onChange={(event) => setWorkoutDate(event.target.value)}
            onBlur={() => setDateTouched(true)}
            required
            disabled={isSubmitting}
          />
          {dateError && <p className="field-error">{dateError}</p>}
        </label>

        <div className="set-grid">
          {rows.map((row, index) => {
            const selectedName = exerciseNameById.get(row.exercise_id) || 'Exercise';
            return (
              <div className="set-row-card" key={`${index}-${row.exercise_id || 'empty'}`}>
                <img src={getExerciseImageByName(selectedName)} alt={selectedName} loading="lazy" />
                <div className="set-row-controls">
                  <select
                    value={row.exercise_id}
                    onChange={(event) => updateRow(index, 'exercise_id', event.target.value)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select exercise</option>
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Weight"
                    value={row.weight}
                    onChange={(event) => updateRow(index, 'weight', event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Reps"
                    value={row.reps}
                    onChange={(event) => updateRow(index, 'reps', event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Sets"
                    value={row.sets}
                    onChange={(event) => updateRow(index, 'sets', event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button type="button" className="ghost-btn" onClick={() => removeRow(index)} disabled={isSubmitting}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={addRow} disabled={isSubmitting}>Add Set</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Log Workout'}
          </button>
        </div>
      </form>

      <div className="history-list">
        <h3>Workout History</h3>
        {workouts.length === 0 ? (
          <EmptyState
            icon="🏋️"
            title="No workouts yet"
            description="Log your first workout above to start tracking your progress."
          />
        ) : (
          workouts.map((workout) => {
            const volume = workout.sets.reduce(
              (sum, setItem) => sum + Number(setItem.weight) * Number(setItem.reps) * Number(setItem.sets),
              0
            );

            return (
              <article key={workout.id} className="history-card stagger-item">
                <div className="history-header">
                  <h4>{new Date(workout.date).toLocaleDateString()}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>{Math.round(volume).toLocaleString()} volume</span>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => setDeletingId(workout.id)}
                      aria-label="Delete workout"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <ul>
                  {workout.sets.map((setItem) => {
                    const name = exerciseNameById.get(setItem.exercise_id) || setItem.exercise_id;
                    return (
                      <li key={setItem.id}>
                        <strong>{name}</strong>
                        <span>
                          {setItem.weight} kg x {setItem.reps} reps x {setItem.sets} sets
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })
        )}
      </div>

      {deletingId && (
        <ConfirmDialog
          title="Delete workout?"
          message="This will permanently remove this workout session and all its sets."
          onConfirm={() => deleteWorkout(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </section>
  );
}
