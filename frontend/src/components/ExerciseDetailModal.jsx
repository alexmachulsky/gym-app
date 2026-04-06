export default function ExerciseDetailModal({ exercise, onClose }) {
  if (!exercise) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-box exercise-detail-modal" onClick={(e) => e.stopPropagation()}>
        <img src={exercise.image} alt={exercise.name} className="detail-modal-img" />
        <h3 className="dialog-title">{exercise.name}</h3>

        <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
          <span className="chip">{exercise.category}</span>
          <span className="chip muted">{exercise.difficulty}</span>
          {exercise.equipment && <span className="chip muted">{exercise.equipment}</span>}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 0.6rem' }}>
          {exercise.description}
        </p>

        <div style={{ marginBottom: '0.75rem' }}>
          <strong style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Muscle Focus
          </strong>
          <p className="focus-line" style={{ margin: '0.2rem 0 0' }}>{exercise.focus}</p>
        </div>

        <div className="dialog-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
