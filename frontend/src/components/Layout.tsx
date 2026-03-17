import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Logo size={28} />
            <span>vibe-kanban</span>
          </Link>
          {user && (
            <>
              <Link to="/settings" className="text-sm text-gray-600 hover:text-gray-900">
                Projects
              </Link>
              {user.role === 'super_admin' && (
                <Link to="/admin" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                  Admin
                </Link>
              )}
            </>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.display_name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
