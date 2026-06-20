import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const InventoriPage = lazy(() => import('./pages/admin/InventoriPage'));
const KategoriPage = lazy(() => import('./pages/admin/KategoriPage'));
const TransaksiPage = lazy(() => import('./pages/admin/TransaksiPage'));
const LaporanPage = lazy(() => import('./pages/admin/LaporanPage'));
const PenggunaPage = lazy(() => import('./pages/admin/PenggunaPage'));
const KasirPage = lazy(() => import('./pages/kasir/KasirPage'));
const RiwayatPage = lazy(() => import('./pages/kasir/RiwayatPage'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/kasir" replace />;
  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/kasir'} replace />;
  return children;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2d1a08',
              color: '#faf3e0',
              fontFamily: 'Lato, sans-serif',
              borderRadius: '10px',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#e6a817', secondary: '#2d1a08' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected - with layout */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              {/* Admin routes */}
              <Route path="dashboard" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
              <Route path="inventori" element={<ProtectedRoute adminOnly><InventoriPage /></ProtectedRoute>} />
              <Route path="kategori" element={<ProtectedRoute adminOnly><KategoriPage /></ProtectedRoute>} />
              <Route path="transaksi" element={<ProtectedRoute adminOnly><TransaksiPage /></ProtectedRoute>} />
              <Route path="laporan" element={<ProtectedRoute adminOnly><LaporanPage /></ProtectedRoute>} />
              <Route path="pengguna" element={<ProtectedRoute adminOnly><PenggunaPage /></ProtectedRoute>} />
              {/* Kasir routes */}
              <Route path="kasir" element={<ProtectedRoute><KasirPage /></ProtectedRoute>} />
              <Route path="riwayat" element={<ProtectedRoute><RiwayatPage /></ProtectedRoute>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
