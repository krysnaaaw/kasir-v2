import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ADMIN_MENU = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/inventori', icon: '📦', label: 'Inventori' },
  { path: '/kategori', icon: '🏷️', label: 'Kategori' },
  { path: '/kasir', icon: '🛒', label: 'Kasir' },
  { path: '/riwayat', icon: '📋', label: 'Riwayat' },
  { path: '/laporan', icon: '📊', label: 'Laporan' },
  { path: '/pengguna', icon: '👥', label: 'Pengguna' },
];

const KASIR_MENU = [
  { path: '/kasir', icon: '🛒', label: 'Kasir' },
  { path: '/riwayat', icon: '📋', label: 'Riwayat' },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  const menu = user?.role === 'admin' ? ADMIN_MENU : KASIR_MENU;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const { data } = await api.get('/products/low-stock');
        if (data.success) setLowStockCount(data.count);
      } catch { /* ignore */ }
    };
    if (user) fetchLowStock();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Berhasil logout');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-wood-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center">
            <span className="text-wood-800 font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="font-display text-cream-100 text-lg leading-tight">POS Klasik</h1>
            <p className="text-wood-300 text-xs">Sistem Kasir UMKM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold transition-all duration-150 relative group
              ${isActive
                ? 'bg-gold-500 text-wood-900 shadow-md'
                : 'text-wood-200 hover:bg-wood-700 hover:text-cream-100'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/inventori' && lowStockCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {lowStockCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-wood-700">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-wood-700 mb-2">
          <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
            <span className="text-wood-800 font-bold text-sm">{user?.nama?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cream-100 text-sm font-semibold truncate">{user?.nama}</p>
            <p className="text-wood-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-wood-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-wood-800 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-wood-800 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-cream-100 p-1.5 rounded-lg hover:bg-wood-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display text-cream-100 text-lg flex-1">POS Klasik</h1>
          {lowStockCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              ⚠️ {lowStockCount}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
