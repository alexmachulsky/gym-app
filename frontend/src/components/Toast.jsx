import { useToast } from '../hooks/useToast';

export default function Toast({ id, message, severity }) {
  const { removeToast } = useToast();

  return (
    <div className={`toast toast-${severity}`} role="alert">
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={() => removeToast(id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
