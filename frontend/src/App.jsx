import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';

import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';
import AppLayout from '@/components/layout/AppLayout.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { MonthProvider } from '@/context/MonthContext.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import HouseholdSetupPage from '@/pages/HouseholdSetupPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import ReportsPage from '@/pages/ReportsPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import TransactionsPage from '@/pages/TransactionsPage.jsx';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/setup',
    element: (
      <ProtectedRoute>
        <HouseholdSetupPage />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute requireHousehold>
        <MonthProvider>
          <AppLayout />
        </MonthProvider>
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/transactions', element: <TransactionsPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
