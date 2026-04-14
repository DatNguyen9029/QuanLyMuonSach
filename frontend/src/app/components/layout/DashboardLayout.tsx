import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored session data
    localStorage.removeItem('happyLibraryAdmin');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
