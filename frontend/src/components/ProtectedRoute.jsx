import { Navigate, useLocation } from 'react-router-dom';

import { isTokenExpired } from '../utils/jwt';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('access_token');

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
