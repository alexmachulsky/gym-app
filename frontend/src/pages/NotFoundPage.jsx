import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-shell">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="not-found-link">Back to workouts</Link>
      </div>
    </div>
  );
}
