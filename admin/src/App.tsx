import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import SongUploadPage from './pages/SongUploadPage';
import SongManagementPage from './pages/SongManagementPage';
import AccountManagementPage from './pages/AccountManagementPage';
import LoginPage from './pages/LoginPage';

// Simple authentication check
const ProtectedRoute = () => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountManagementPage />} />
            <Route path="songs" element={<SongManagementPage />} />
            <Route path="songs/upload" element={<SongUploadPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
