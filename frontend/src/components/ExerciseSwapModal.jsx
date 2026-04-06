import { useEffect, useState } from 'react';

import api from '../api/client';

export default function ExerciseSwapModal({ exerciseId, exercises, onSelect, onClose }) {
  const [alternatives, setAlternatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!exerciseId) return;
    setIsLoading(true);
    api.get(`/exercises/${exerciseId}/alternatives`)
      .then((res) => setAlternatives(res.data))
      .catch(() => setAlternatives([]))
      .finally(() => setIsLoading(false));
  }, [exerciseId]);

  const currentExercise = exercises.find((e) => e.id === exerciseId);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-box swap-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="dialog-title">
          Swap {currentExercise?.name || 'Exercise'}
        </h3>
        <p className="dialog-message">
          Select an alternative targeting the same muscle group.
        </p>

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading alternatives…</p>
        ) : alternatives.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No alternatives found. Try categorizing your exercises.</p>
        ) : (
          <ul className="swap-list">
            {alternatives.map((alt) => (
              <li key={alt.id} className="swap-item">
                <div>
                  <strong>{alt.name}</strong>
                  {alt.muscle_group && <span className="chip muted" style={{ marginLeft: '0.4rem' }}>{alt.muscle_group}</span>}
                </div>
                <button type="button" onClick={() => { onSelect(alt.id); onClose(); }}>
                  Use
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="dialog-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
