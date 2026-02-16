import { useEffect, useState } from 'react';

import api from '../api/client';

const makeSetRow = () => ({ exercise_id: '', weight: '', reps: '', sets: '' });

export default function WorkoutsPage() {
  const [workoutDate, setWorkoutDate] = useState('');
  const [rows, setRows] = useState([makeSetRow()]);
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    const [exerciseRes, workoutRes] = await Promise.all([
      api.get('/exercises'),
      api.get('/workouts'),
    ]);
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
    <section>
      <h2>Workouts</h2>

      <form onSubmit={createWorkout}>
        <input
          type="date"
          value={workoutDate}
          onChange={(event) => setWorkoutDate(event.target.value)}
          required
        />

        {rows.map((row, index) => (
          <div className="set-row" key={`${index}-${row.exercise_id}`}>
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
            <button type="button" onClick={() => removeRow(index)}>
              Remove
            </button>
          </div>
        ))}

        <div className="button-row">
          <button type="button" onClick={addRow}>Add Set Row</button>
          <button type="submit">Log Workout</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <h3>Workout History</h3>
      <div className="history-list">
        {workouts.map((workout) => (
          <article key={workout.id} className="history-card">
            <h4>{workout.date}</h4>
            <ul>
              {workout.sets.map((setItem) => {
                const name = exercises.find((exercise) => exercise.id === setItem.exercise_id)?.name || setItem.exercise_id;
                return (
                  <li key={setItem.id}>
                    {name}: {setItem.weight}kg x {setItem.reps} reps x {setItem.sets} sets
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
