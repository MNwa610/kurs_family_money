import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext.jsx';

export default function ProtectedRoute({ children, requireHousehold = false }) {
  const { user, hasHousehold, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireHousehold && !hasHousehold) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
