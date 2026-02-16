import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <header>
        <h1>Smart Gym Progress Tracker</h1>
        <nav>
          <Link to="/workouts">Workouts</Link>
          <Link to="/exercises">Exercises</Link>
          <Link to="/body-metrics">Body Metrics</Link>
          <Link to="/progress">Progress</Link>
          <button type="button" onClick={logout}>Logout</button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
