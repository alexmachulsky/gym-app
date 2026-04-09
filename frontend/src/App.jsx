import { Navigate, Route, Routes } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import BodyMetricsPage from './pages/BodyMetricsPage';
import ExercisesPage from './pages/ExercisesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GoalsPage from './pages/GoalsPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import PrivacyPage from './pages/PrivacyPage';
import ProgressPage from './pages/ProgressPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import TemplatesPage from './pages/TemplatesPage';
import TermsPage from './pages/TermsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AICoachPage from './pages/AICoachPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import WorkoutsPage from './pages/WorkoutsPage';
import { ToastProvider } from './hooks/useToast';
import { SubscriptionProvider } from './hooks/useSubscription';

export default function App() {
  return (
    <ToastProvider>
      <ToastContainer />
      <ErrorBoundary>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Authenticated app */}
          <Route
            element={
              <ProtectedRoute>
                <SubscriptionProvider>
                  <Layout />
                </SubscriptionProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/body-metrics" element={<BodyMetricsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/ai-coach" element={<AICoachPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </ToastProvider>
  );
}
