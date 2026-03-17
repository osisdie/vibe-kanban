import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/settings" replace />;
  }

  return <>{children}</>;
}
