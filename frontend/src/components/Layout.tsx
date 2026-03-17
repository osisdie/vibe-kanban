import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import UserAvatar from './UserAvatar';

export default function Layout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <Logo size={28} />
            <span>vibe-kanban</span>
          </Link>
          {user && (
            <Link to="/settings" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Projects
            </Link>
          )}
        </div>
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <UserAvatar displayName={user.display_name} avatarUrl={user.avatar_url} size={32} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{user.display_name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Edit Profile
                </Link>

                {user.role === 'super_admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Admin Dashboard
                  </Link>
                )}

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 mt-1">
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
      <main className="min-h-[calc(100vh-108px)]">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-700 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        <span>&copy; 2026 vibe-kanban. Maintained by </span>
        <a
          href="https://github.com/osisdie"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          Kevin Wu
        </a>
      </footer>
    </div>
  );
}
