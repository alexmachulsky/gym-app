import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import api from '../api/client';
import Confetti from '../components/Confetti';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import RestTimer from '../components/RestTimer';
import ExerciseSwapModal from '../components/ExerciseSwapModal';
import GenerateWorkoutModal from '../components/GenerateWorkoutModal';
import ActiveWorkout from '../components/ActiveWorkout';
import WorkoutShareCard from '../components/WorkoutShareCard';
import { getExerciseImageByName, getStretchSuggestionsForExercises } from '../data/exerciseLibrary';
import { useToast } from '../hooks/useToast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCountUp } from '../hooks/useCountUp';
import { parseWorkoutText } from '../utils/workoutParser';

const makeSetRow = () => ({ exercise_id: '', weight: '', reps: '', sets: '' });

function StatCard({ label, value, format }) {
  const animated = useCountUp(value);
  return (
    <article className="stat-card stagger-item">
      <h3>{label}</h3>
      <p>{format === 'locale' ? animated.toLocaleString() : animated}</p>
    </article>
  );
}

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const [notes, setNotes] = useState('');
  const [effortRating, setEffortRating] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [lastRecords, setLastRecords] = useState([]);

  // Running workout timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  // Workout history search/filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Swap modal
  const [swapRowIndex, setSwapRowIndex] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeMode, setActiveMode] = useState(false);
  const [stretchTips, setStretchTips] = useState([]);
  const [sharingWorkout, setSharingWorkout] = useState(null);
  const [streak, setStreak] = useState(null);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogText, setQuickLogText] = useState('');
  const [lastSetHints, setLastSetHints] = useState({});
  const [dragIndex, setDragIndex] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const dateError = dateTouched && workoutDate && workoutDate > new Date().toISOString().slice(0, 10)
    ? 'Workout date cannot be in the future'
    : '';

  const formRef = useRef(null);

  useKeyboardShortcuts([
    { key: 'n', handler: () => { setWorkoutDate(new Date().toISOString().slice(0, 10)); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { key: 's', ctrl: true, handler: () => { formRef.current?.requestSubmit(); } },
    { key: 'Escape', handler: () => { setShowQuickLog(false); setShowImport(false); setShowGenerate(false); } },
  ]);

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
    api.get('/progress/streak/current').then(r => setStreak(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadData().catch(() => addToast('Failed to load workout data', 'error'));

    // Check for template prefill from TemplatesPage
    const prefill = sessionStorage.getItem('template_prefill');
    if (prefill) {
      try {
        const parsed = JSON.parse(prefill);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRows(parsed);
          setWorkoutDate(new Date().toISOString().slice(0, 10));
          addToast('Template loaded — adjust and log.', 'info');
        }
      } catch { /* ignore invalid data */ }
      sessionStorage.removeItem('template_prefill');
    }

    // Check for AI-parsed workout from AICoachPage
    const aiParsed = sessionStorage.getItem('ai_parsed_workout');
    if (aiParsed) {
      try {
        const parsed = JSON.parse(aiParsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRows(parsed);
          setWorkoutDate(new Date().toISOString().slice(0, 10));
          addToast('AI workout loaded — review and log.', 'info');
        }
      } catch { /* ignore invalid data */ }
      sessionStorage.removeItem('ai_parsed_workout');
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = useCallback(() => {
    startedAtRef.current = new Date();
    setElapsed(0);
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
  }, []);

  const repeatWorkout = useCallback((workout) => {
    setWorkoutDate(new Date().toISOString().slice(0, 10));
    setRows(
      workout.sets.map((s) => ({
        exercise_id: s.exercise_id,
        weight: String(s.weight),
        reps: String(s.reps),
        sets: String(s.sets),
      }))
    );
    setNotes('');
    setEffortRating('');
    setDurationMinutes('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('Workout pre-filled — adjust and log.', 'info');
  }, [addToast]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (historyDateFrom && w.date < historyDateFrom) return false;
      if (historyDateTo && w.date > historyDateTo) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const hasMatch = w.sets.some((s) => {
          const name = exerciseNameById.get(s.exercise_id) || '';
          return name.toLowerCase().includes(q);
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [workouts, historySearch, historyDateFrom, historyDateTo, exerciseNameById]);

  const useGeneratedWorkout = useCallback((suggestions) => {
    const exerciseNameToId = new Map(exercises.map((e) => [e.name.toLowerCase(), e.id]));
    const newRows = suggestions.map((s) => ({
      exercise_id: exerciseNameToId.get(s.exercise_name.toLowerCase()) || '',
      weight: s.weight ? String(s.weight) : '',
      reps: String(s.reps),
      sets: String(s.sets),
    }));
    setRows(newRows.length > 0 ? newRows : [makeSetRow()]);
    setWorkoutDate(new Date().toISOString().slice(0, 10));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('Generated workout loaded — adjust and log.', 'info');
  }, [exercises, addToast]);

  const importFromText = useCallback(() => {
    const parsed = parseWorkoutText(importText);
    if (parsed.length === 0) {
      addToast('No valid lines found. Use format: Exercise 3x8 @80', 'error');
      return;
    }
    const exerciseNameToId = new Map(exercises.map((e) => [e.name.toLowerCase(), e.id]));
    const newRows = parsed.map((p) => ({
      exercise_id: exerciseNameToId.get(p.name.toLowerCase()) || '',
      weight: String(p.weight),
      reps: String(p.reps),
      sets: String(p.sets),
    }));
    setRows(newRows);
    setWorkoutDate(new Date().toISOString().slice(0, 10));
    setShowImport(false);
    setImportText('');
    addToast(`Imported ${parsed.length} exercise(s) — review and log.`, 'info');
  }, [importText, exercises, addToast]);

  const showStretchSuggestions = () => {
    const selectedNames = rows
      .map((r) => exerciseNameById.get(r.exercise_id))
      .filter(Boolean);
    if (selectedNames.length === 0) {
      addToast('Add exercises first to see stretch suggestions', 'info');
      return;
    }
    const tips = getStretchSuggestionsForExercises(selectedNames);
    setStretchTips(tips.length > 0 ? tips : ['No specific suggestions — try a general warm-up.']);
  };

  const updateRow = (index, key, value) => {
    const clone = [...rows];
    clone[index][key] = value;
    setRows(clone);

    // Smart defaults: fetch last sets when exercise changes
    if (key === 'exercise_id' && value) {
      if (lastSetHints[value]) return; // Already cached
      api.get(`/workouts/last-sets/${value}`).then(r => {
        if (r.data.last_sets) {
          setLastSetHints(prev => ({ ...prev, [value]: r.data.last_sets }));
        }
      }).catch(() => {});
    }
  };

  const applyLastSets = (index, exerciseId) => {
    const hint = lastSetHints[exerciseId];
    if (!hint) return;
    const clone = [...rows];
    clone[index] = { ...clone[index], weight: String(hint.weight), reps: String(hint.reps), sets: String(hint.sets) };
    setRows(clone);
  };

  const addRow = () => setRows((prev) => [...prev, makeSetRow()]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  // Quick-log: parse text and populate rows
  const applyQuickLog = useCallback(() => {
    const parsed = parseWorkoutText(quickLogText);
    if (parsed.length === 0) {
      addToast('No valid lines found. Use format: Exercise 3x8 @80', 'error');
      return;
    }
    const exerciseNameToId = new Map(exercises.map((e) => [e.name.toLowerCase(), e.id]));
    const newRows = parsed.map((p) => ({
      exercise_id: exerciseNameToId.get(p.name.toLowerCase()) || '',
      weight: String(p.weight),
      reps: String(p.reps),
      sets: String(p.sets),
    }));
    setRows(newRows);
    setWorkoutDate(new Date().toISOString().slice(0, 10));
    setShowQuickLog(false);
    setQuickLogText('');
    addToast(`${parsed.length} exercise(s) loaded from quick-log`, 'info');
  }, [quickLogText, exercises, addToast]);

  // Drag-to-reorder
  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const clone = [...rows];
    const [moved] = clone.splice(dragIndex, 1);
    clone.splice(index, 0, moved);
    setRows(clone);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

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
      notes: notes || null,
      effort_rating: effortRating ? Number(effortRating) : null,
      duration_seconds: timerRunning ? elapsed : (durationMinutes ? Number(durationMinutes) * 60 : null),
    };

    try {
      const res = await api.post('/workouts', payload);
      setRows([makeSetRow()]);
      setWorkoutDate('');
      setNotes('');
      setEffortRating('');
      setDurationMinutes('');
      if (res.data.new_records && res.data.new_records.length > 0) {
        setLastRecords(res.data.new_records);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        res.data.new_records.forEach((r) => addToast(`🏆 PR! ${r.exercise_name}: ${r.record_type} → ${r.new_value}`, 'success'));
      }
      stopTimer();
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
      {showConfetti && <Confetti />}
      <div className="panel-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2>Workout Log</h2>
          {streak && streak.current_streak > 0 && (
            <span className="streak-badge" title={`Longest streak: ${streak.longest_streak} days`}>
              🔥 {streak.current_streak} day{streak.current_streak !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p>Capture sessions with set-level detail and watch total workload build over time.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Sessions" value={metrics.totalSessions} />
        <StatCard label="Total Sets" value={metrics.totalSets} />
        <StatCard label="Total Volume" value={metrics.totalVolume} format="locale" />
      </div>

      <div className="workout-timer-bar">
        {timerRunning ? (
          <>
            <span className="timer-badge running">⏱ {formatElapsed(elapsed)}</span>
            <button type="button" className="ghost-btn" onClick={stopTimer} style={{ width: 'auto' }}>Stop Timer</button>
          </>
        ) : (
          <button type="button" className="ghost-btn" onClick={startTimer} style={{ width: 'auto' }}>▶ Start Workout Timer</button>
        )}
        <button type="button" className="ghost-btn" onClick={() => setShowGenerate(true)} style={{ width: 'auto' }}>⚡ Generate Workout</button>
        <button type="button" className="ghost-btn" onClick={() => setShowImport(true)} style={{ width: 'auto' }}>📋 Import Text</button>
        <button type="button" className="ghost-btn" onClick={() => setShowQuickLog(!showQuickLog)} style={{ width: 'auto' }}>⚡ Quick Log</button>
        <button type="button" className="ghost-btn" onClick={showStretchSuggestions} style={{ width: 'auto' }}>🧘 Warm-Up Tips</button>
        <button type="button" className="ghost-btn" onClick={() => setActiveMode(true)} style={{ width: 'auto' }}>🏋️ Active Mode</button>
      </div>

      {stretchTips.length > 0 && (
        <div className="stretch-tips">
          <div className="stretch-tips-header">
            <strong>Suggested Warm-Up / Stretches</strong>
            <button type="button" className="ghost-btn" onClick={() => setStretchTips([])} style={{ width: 'auto', padding: '0.2rem 0.5rem' }}>✕</button>
          </div>
          <ul>{stretchTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      {showQuickLog && (
        <div className="quick-log-panel">
          <p className="quick-log-hint">Type exercises, one per line: <code>Bench Press 3x8 @80</code></p>
          <textarea
            rows={4}
            placeholder={"Bench Press 3x8 @80\nSquat 5x5 @100\nPull Ups 3x10"}
            value={quickLogText}
            onChange={(e) => setQuickLogText(e.target.value)}
            autoFocus
          />
          <div className="button-row">
            <button type="button" className="ghost-btn" onClick={() => { setShowQuickLog(false); setQuickLogText(''); }}>Cancel</button>
            <button type="button" onClick={applyQuickLog}>Populate Rows</button>
          </div>
        </div>
      )}

      {activeMode ? (
        <ActiveWorkout
          exercises={exercises}
          exerciseNameById={exerciseNameById}
          onFinish={() => { setActiveMode(false); loadData(); }}
          onCancel={() => setActiveMode(false)}
        />
      ) : (
      <>
      <div className="workout-form-rest-wrap">
      <form className="workout-form" onSubmit={createWorkout} ref={formRef}>
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

        <div className="workout-meta-row">
          <label>
            Duration (min)
            <input
              type="number" min="1" max="600" placeholder="e.g. 60"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label>
            Effort (1-10)
            <input
              type="number" min="1" max="10" placeholder="e.g. 7"
              value={effortRating}
              onChange={(e) => setEffortRating(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label>
            Notes
            <input
              placeholder="Session notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="set-grid">
          {rows.map((row, index) => {
            const selectedName = exerciseNameById.get(row.exercise_id) || 'Exercise';
            return (
              <div
                className={`set-row-card${dragIndex === index ? ' dragging' : ''}`}
                key={`${index}-${row.exercise_id || 'empty'}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle" title="Drag to reorder">⠿</span>
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
                  {row.exercise_id && lastSetHints[row.exercise_id] && !row.weight && !row.reps && !row.sets && (
                    <button
                      type="button"
                      className="smart-default-hint"
                      onClick={() => applyLastSets(index, row.exercise_id)}
                      title="Apply last session values"
                    >
                      Last: {lastSetHints[row.exercise_id].weight}kg × {lastSetHints[row.exercise_id].reps} × {lastSetHints[row.exercise_id].sets}
                    </button>
                  )}
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
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {row.exercise_id && (
                      <button type="button" className="ghost-btn" onClick={() => setSwapRowIndex(index)} disabled={isSubmitting} title="Swap exercise">
                        ⇄
                      </button>
                    )}
                    <button type="button" className="ghost-btn" onClick={() => removeRow(index)} disabled={isSubmitting}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={addRow} disabled={isSubmitting}>Add Set</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : <>Log Workout <kbd>⌘S</kbd></>}
          </button>
        </div>
      </form>

      <RestTimer defaultSeconds={90} />
      </div>

      {lastRecords.length > 0 && (
        <div className="pr-banner">
          <h3>🏆 Personal Records</h3>
          <div className="pr-list">
            {lastRecords.map((r, i) => (
              <div key={i} className="pr-item">
                <strong>{r.exercise_name}</strong>
                <span>{r.record_type === 'max_weight' ? 'Weight' : 'Volume'}: {r.new_value}{r.old_value != null ? ` (prev: ${r.old_value})` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="history-list">
        <div className="history-list-header">
          <h3>Workout History</h3>
          {workouts.length > 0 && (
            <button
              type="button"
              className="ghost-btn"
              style={{ width: 'auto' }}
              onClick={() => {
                const token = localStorage.getItem('access_token');
                const link = document.createElement('a');
                link.href = `${api.defaults.baseURL}/export/workouts?format=csv`;
                fetch(link.href, { headers: { Authorization: `Bearer ${token}` } })
                  .then(r => r.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'workouts.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  })
                  .catch(() => addToast('Export failed', 'error'));
              }}
            >
              ⬇ Export CSV
            </button>
          )}
        </div>

        <div className="history-filters">
          <input
            placeholder="Search by exercise…"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
          <input type="date" value={historyDateFrom} onChange={(e) => setHistoryDateFrom(e.target.value)} />
          <input type="date" value={historyDateTo} onChange={(e) => setHistoryDateTo(e.target.value)} />
        </div>

        {filteredWorkouts.length === 0 ? (
          <EmptyState
            icon="🏋️"
            title="No workouts yet"
            description="Log your first workout above to start tracking your progress."
          />
        ) : (
          filteredWorkouts.map((workout) => {
            const volume = workout.sets.reduce(
              (sum, setItem) => sum + Number(setItem.weight) * Number(setItem.reps) * Number(setItem.sets),
              0
            );

            return (
              <article key={workout.id} className="history-card stagger-item">
                <div className="history-header">
                  <h4>{new Date(workout.date).toLocaleDateString()}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {workout.duration_seconds && <span className="chip muted">{Math.round(workout.duration_seconds / 60)} min</span>}
                    {workout.effort_rating && <span className="chip">RPE {workout.effort_rating}</span>}
                    {workout.estimated_calories && <span className="chip muted">{workout.estimated_calories} kcal</span>}
                    <span>{Math.round(volume).toLocaleString()} vol</span>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => setDeletingId(workout.id)}
                      aria-label="Delete workout"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      className="repeat-btn"
                      onClick={() => repeatWorkout(workout)}
                      aria-label="Repeat workout"
                    >
                      ↻
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ width: 'auto', padding: '0.15rem 0.5rem', fontSize: '0.82rem' }}
                      onClick={() => setSharingWorkout(workout)}
                      aria-label="Share workout"
                    >
                      📤
                    </button>
                  </div>
                </div>
                {workout.notes && <p style={{ margin: '0 0 0.4rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{workout.notes}</p>}
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

      {swapRowIndex !== null && rows[swapRowIndex]?.exercise_id && (
        <ExerciseSwapModal
          exerciseId={rows[swapRowIndex].exercise_id}
          exercises={exercises}
          onSelect={(newId) => updateRow(swapRowIndex, 'exercise_id', newId)}
          onClose={() => setSwapRowIndex(null)}
        />
      )}

      </>
      )}

      {showGenerate && (
        <GenerateWorkoutModal
          onUse={useGeneratedWorkout}
          onClose={() => setShowGenerate(false)}
        />
      )}

      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Import Workout from Text</h3>
            <p className="modal-hint">One exercise per line. Format: <code>Exercise SetsxReps @Weight</code></p>
            <textarea
              rows={8}
              placeholder={"Bench Press 3x8 @80\nSquat 5x5 @100\nPull Ups 3x10"}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="button-row">
              <button type="button" className="ghost-btn" onClick={() => setShowImport(false)}>Cancel</button>
              <button type="button" onClick={importFromText}>Import</button>
            </div>
          </div>
        </div>
      )}

      {sharingWorkout && (
        <WorkoutShareCard
          workout={sharingWorkout}
          exerciseNameById={exerciseNameById}
          onClose={() => setSharingWorkout(null)}
        />
      )}
    </section>
  );
}
