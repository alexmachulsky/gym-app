import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import BodyMetricsPage from './pages/BodyMetricsPage';
import ExercisesPage from './pages/ExercisesPage';
import LoginPage from './pages/LoginPage';
import ProgressPage from './pages/ProgressPage';
import RegisterPage from './pages/RegisterPage';
import WorkoutsPage from './pages/WorkoutsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/body-metrics" element={<BodyMetricsPage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/workouts" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
