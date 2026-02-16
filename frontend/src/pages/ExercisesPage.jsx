import { useEffect, useState } from 'react';

import api from '../api/client';

export default function ExercisesPage() {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');

  const loadExercises = async () => {
    const response = await api.get('/exercises');
    setExercises(response.data);
  };

  useEffect(() => {
    loadExercises().catch(() => setError('Failed to load exercises'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/exercises', { name });
      setName('');
      await loadExercises();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exercise');
    }
  };

  return (
    <section>
      <h2>Exercises</h2>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          placeholder="Exercise name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <tr key={exercise.id}>
              <td>{exercise.name}</td>
              <td>{new Date(exercise.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
