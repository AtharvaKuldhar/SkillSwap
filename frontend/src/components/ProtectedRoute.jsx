import { Navigate } from 'react-router-dom';

/**
 * Wraps a route so that unauthenticated users are redirected to /login.
 * Also validates that the stored user JSON is parseable.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" replace />;

  // Make sure the stored user object is valid JSON
  try {
    const raw = localStorage.getItem('user');
    if (!raw) throw new Error('missing');
    JSON.parse(raw);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return children;
}
