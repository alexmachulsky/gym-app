import { useEffect, useMemo, useState } from 'react';

import api from '../api/client';
import { EXERCISE_LIBRARY, LIBRARY_CATEGORIES } from '../data/exerciseLibrary';

export default function ExercisesPage() {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadExercises = async () => {
    const response = await api.get('/exercises');
    setExercises(response.data);
  };

  useEffect(() => {
    loadExercises().catch(() => setError('Failed to load exercises'));
  }, []);

  const existingExerciseNames = useMemo(
    () => new Set(exercises.map((exercise) => exercise.name.trim().toLowerCase())),
    [exercises]
  );

  const filteredLibrary = useMemo(() => {
    const base = EXERCISE_LIBRARY.filter((exercise) => {
      const categoryMatch = category === 'All' || exercise.category === category;
      const searchMatch =
        search.trim() === '' ||
        exercise.name.toLowerCase().includes(search.toLowerCase()) ||
        exercise.focus.toLowerCase().includes(search.toLowerCase());

      return categoryMatch && searchMatch;
    });

    if (!showOnlyMissing) return base;
    return base.filter((exercise) => !existingExerciseNames.has(exercise.name.toLowerCase()));
  }, [category, existingExerciseNames, search, showOnlyMissing]);

  const createExercise = async (exerciseName) => {
    setError('');
    setNotice('');

    try {
      await api.post('/exercises', { name: exerciseName });
      setName('');
      await loadExercises();
      setNotice(`Added "${exerciseName}" to your exercise list.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exercise');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await createExercise(name);
  };

  const addVisibleExercises = async () => {
    setError('');
    setNotice('');

    const addable = filteredLibrary.filter(
      (exercise) => !existingExerciseNames.has(exercise.name.toLowerCase())
    );

    if (addable.length === 0) {
      setNotice('All visible exercises are already in your list.');
      return;
    }

    try {
      await Promise.all(addable.map((exercise) => api.post('/exercises', { name: exercise.name })));
      await loadExercises();
      setNotice(`Added ${addable.length} exercises from the current view.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add visible exercises');
    }
  };

  const addableVisibleCount = filteredLibrary.filter(
    (exercise) => !existingExerciseNames.has(exercise.name.toLowerCase())
  ).length;

  return (
    <section className="panel fade-in">
      <div className="panel-heading">
        <h2>Exercise Catalog</h2>
        <p>Popular movements across strength, hypertrophy, cardio, olympic lifting, and mobility.</p>
      </div>

      <div className="library-summary">
        <article>
          <span>Total Templates</span>
          <strong>{EXERCISE_LIBRARY.length}</strong>
        </article>
        <article>
          <span>Visible Templates</span>
          <strong>{filteredLibrary.length}</strong>
        </article>
        <article>
          <span>Addable Visible</span>
          <strong>{addableVisibleCount}</strong>
        </article>
      </div>

      <div className="exercise-tools">
        <form className="create-exercise-form" onSubmit={handleSubmit}>
          <input
            placeholder="Create a custom exercise"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <button type="submit">Add Exercise</button>
        </form>

        <div className="library-filters">
          <input
            placeholder="Search by name or muscle focus"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {LIBRARY_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="library-toolbar">
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={showOnlyMissing}
              onChange={(event) => setShowOnlyMissing(event.target.checked)}
            />
            Show only exercises not yet added
          </label>
          <button type="button" className="ghost-btn" onClick={addVisibleExercises}>
            Add all visible
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      {filteredLibrary.length === 0 ? (
        <div className="exercise-empty">
          <h3>No exercises match this filter</h3>
          <p>Try clearing the search or switching category.</p>
        </div>
      ) : (
        <div className="exercise-library-grid">
          {filteredLibrary.map((exercise) => {
            const alreadyAdded = existingExerciseNames.has(exercise.name.toLowerCase());
            return (
              <article key={exercise.name} className="exercise-library-card stagger-item">
                <img src={exercise.image} alt={exercise.name} loading="lazy" />
                <div>
                  <div className="chip-row">
                    <span className="chip">{exercise.category}</span>
                    <span className="chip muted">{exercise.difficulty}</span>
                  </div>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.description}</p>
                  <p className="focus-line">Focus: {exercise.focus}</p>
                </div>
                <button
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => createExercise(exercise.name)}
                >
                  {alreadyAdded ? 'Added' : 'Add to My Exercises'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="table-wrap">
        <h3>My Exercise List ({exercises.length})</h3>
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
      </div>
    </section>
  );
}
