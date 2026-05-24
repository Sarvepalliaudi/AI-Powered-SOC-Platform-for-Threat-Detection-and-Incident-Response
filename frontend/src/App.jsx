import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LogAnalysis from './pages/LogAnalysis';
import Alerts from './pages/Alerts';
import IncidentResponse from './pages/IncidentResponse';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import About from './pages/About';
import UserManual from './pages/UserManual';
import LoadingSpinner from './components/common/LoadingSpinner';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="logs" element={<LogAnalysis />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="incidents" element={<IncidentResponse />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="about" element={<About />} />
        <Route path="manual" element={<UserManual />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
