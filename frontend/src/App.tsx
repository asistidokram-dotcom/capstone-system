import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Proposals from './pages/Proposals';
import Schedules from './pages/Schedules';
import ManageUsers from './pages/ManageUsers';
import AuditLogs from './pages/AuditLogs';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  // Check if token exists
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#333', color: '#fff', borderRadius: '8px' },
          success: { style: { background: '#10b981' } },
          error: { style: { background: '#ef4444' } }
        }} 
      />

      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        
        <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;