import { useEffect, useMemo, useState } from 'react';

import api from '../api/client';
import { getExerciseImageByName } from '../data/exerciseLibrary';

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
  const [workoutDate, setWorkoutDate] = useState('');
  const [rows, setRows] = useState([makeSetRow()]);
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [error, setError] = useState('');

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
    loadData().catch(() => setError('Failed to load workout data'));
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
    setError('');

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
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create workout');
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
            onChange={(event) => setWorkoutDate(event.target.value)}
            required
          />
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
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Reps"
                    value={row.reps}
                    onChange={(event) => updateRow(index, 'reps', event.target.value)}
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Sets"
                    value={row.sets}
                    onChange={(event) => updateRow(index, 'sets', event.target.value)}
                    required
                  />
                  <button type="button" className="ghost-btn" onClick={() => removeRow(index)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={addRow}>Add Set</button>
          <button type="submit">Log Workout</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="history-list">
        <h3>Workout History</h3>
        {workouts.map((workout) => {
          const volume = workout.sets.reduce(
            (sum, setItem) => sum + Number(setItem.weight) * Number(setItem.reps) * Number(setItem.sets),
            0
          );

          return (
            <article key={workout.id} className="history-card stagger-item">
              <div className="history-header">
                <h4>{new Date(workout.date).toLocaleDateString()}</h4>
                <span>{Math.round(volume).toLocaleString()} volume</span>
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
        })}
      </div>
    </section>
  );
}
