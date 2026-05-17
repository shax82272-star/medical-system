import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DoctorsPage from './pages/DoctorsPage';
import PatientsPage from './pages/PatientsPage';
import DiagnosesPage from './pages/DiagnosesPage';
import StatisticsPage from './pages/StatisticsPage';
import AnalyzePage from './pages/AnalyzePage';   // <-- yangi

function PrivateRoute({ children, adminOnly }) {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout({ children }) {
  const location = useLocation();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #e8f4f8 0%, #f0f8fb 50%, #eaf6f0 100%)',
    }}>
      <Navbar />
      <main
        key={location.pathname}
        className="page-enter"
        style={{ minHeight: 'calc(100vh - 74px)' }}
      >
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
    </div>
  );
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/doctors" element={<PrivateRoute adminOnly><Layout><DoctorsPage /></Layout></PrivateRoute>} />
      <Route path="/patients" element={<PrivateRoute><Layout><PatientsPage /></Layout></PrivateRoute>} />
      <Route path="/diagnoses" element={<PrivateRoute><Layout><DiagnosesPage /></Layout></PrivateRoute>} />
      <Route path="/statistics" element={<PrivateRoute><Layout><StatisticsPage /></Layout></PrivateRoute>} />
      <Route path="/analyze" element={<PrivateRoute><Layout><AnalyzePage /></Layout></PrivateRoute>} />  {/* yangi */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}