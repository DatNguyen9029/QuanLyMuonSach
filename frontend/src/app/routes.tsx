import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './components/pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './components/pages/Dashboard';
import { BookManagement } from './components/pages/BookManagement';
import { BorrowingManagement } from './components/pages/BorrowingManagement';
import { UserManagement } from './components/pages/UserManagement';
import { ChatSupport } from './components/pages/ChatSupport';
import { Settings } from './components/pages/Settings';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('happyLibraryAdmin');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'books',
        element: <BookManagement />,
      },
      {
        path: 'borrowing',
        element: <BorrowingManagement />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'chat',
        element: <ChatSupport />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
