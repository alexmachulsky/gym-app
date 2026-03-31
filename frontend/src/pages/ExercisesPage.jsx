import { useEffect, useMemo, useState } from 'react';

import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { EXERCISE_LIBRARY, LIBRARY_CATEGORIES } from '../data/exerciseLibrary';
import { useToast } from '../hooks/useToast';

export default function ExercisesPage() {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadExercises = async () => {
    const response = await api.get('/exercises');
    setExercises(response.data);
  };

  useEffect(() => {
    loadExercises().catch(() => addToast('Failed to load exercises', 'error'));
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
    try {
      await api.post('/exercises', { name: exerciseName });
      setName('');
      await loadExercises();
      addToast(`Added "${exerciseName}" to your exercise list.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create exercise', 'error');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createExercise(name);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVisibleExercises = async () => {
    const addable = filteredLibrary.filter(
      (exercise) => !existingExerciseNames.has(exercise.name.toLowerCase())
    );

    if (addable.length === 0) {
      addToast('All visible exercises are already in your list.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(addable.map((exercise) => api.post('/exercises', { name: exercise.name })));
      await loadExercises();
      addToast(`Added ${addable.length} exercises from the current view.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add visible exercises', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExercise = async (id) => {
    try {
      await api.delete(`/exercises/${id}`);
      setExercises((prev) => prev.filter((e) => e.id !== id));
      addToast('Exercise deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete exercise', 'error');
    } finally {
      setDeletingId(null);
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
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Add Exercise'}
          </button>
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
          <button type="button" className="ghost-btn" onClick={addVisibleExercises} disabled={isSubmitting}>
            Add all visible
          </button>
        </div>
      </div>

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
                  disabled={alreadyAdded || isSubmitting}
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.name}</td>
                <td>{new Date(exercise.created_at).toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => setDeletingId(exercise.id)}
                    aria-label="Delete exercise"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingId && (
        <ConfirmDialog
          title="Delete exercise?"
          message="This will permanently remove this exercise. Any workouts using it will retain the exercise ID."
          onConfirm={() => deleteExercise(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </section>
  );
}
