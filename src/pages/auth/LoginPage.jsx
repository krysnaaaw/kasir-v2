import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Email dan password wajib diisi');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        toast.success(`Selamat datang, ${data.data.user.nama}!`);
        navigate(data.data.user.role === 'admin' ? '/dashboard' : '/kasir', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wood-800 flex items-center justify-center px-4">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f4c842 0, #f4c842 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-cream-50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-wood-700 px-8 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="font-display text-wood-800 text-3xl font-bold">P</span>
            </div>
            <h1 className="font-display text-cream-100 text-3xl mb-1">POS Klasik</h1>
            <p className="text-wood-300 text-sm">Sistem Kasir Modern untuk UMKM</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="font-display text-wood-800 text-xl mb-6">Masuk ke Akun</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  className="input-classic"
                  placeholder="admin@posklasik.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-classic pr-11"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-wood-400 hover:text-wood-700 text-lg">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-cream-300 border-t-transparent rounded-full animate-spin" /> Memproses...</>
                ) : '🔐 Masuk'}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 p-4 bg-cream-100 rounded-xl border border-cream-200">
              <p className="text-xs font-semibold text-wood-600 mb-2">🧪 Akun Demo:</p>
              <button onClick={() => setForm({ email: 'admin@posklasik.com', password: 'Admin123!' })}
                className="block w-full text-left text-xs text-wood-600 hover:text-wood-800 py-1 px-2 rounded hover:bg-cream-200 transition-colors">
                👤 Admin: admin@posklasik.com / Admin123!
              </button>
              <button onClick={() => setForm({ email: 'kasir@posklasik.com', password: 'password' })}
                className="block w-full text-left text-xs text-wood-600 hover:text-wood-800 py-1 px-2 rounded hover:bg-cream-200 transition-colors">
                🛒 Kasir: kasir@posklasik.com / password
              </button>
            </div>

            <p className="text-center text-wood-400 text-sm mt-5">
              Belum punya akun?{' '}
              <Link to="/register" className="text-wood-600 font-semibold hover:text-wood-800 underline">
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
