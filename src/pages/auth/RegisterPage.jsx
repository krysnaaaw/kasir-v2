import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'kasir' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      if (data.success) {
        toast.success('Akun berhasil dibuat! Silakan login.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat akun');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wood-800 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f4c842 0, #f4c842 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
      />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="bg-cream-50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-wood-700 px-8 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="font-display text-wood-800 text-2xl font-bold">P</span>
            </div>
            <h1 className="font-display text-cream-100 text-2xl">POS Klasik</h1>
            <p className="text-wood-300 text-sm">Buat Akun Baru</p>
          </div>
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-1.5">Nama Lengkap</label>
                <input className="input-classic" placeholder="Nama Anda" value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-1.5">Email</label>
                <input type="email" className="input-classic" placeholder="email@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-1.5">Password</label>
                <input type="password" className="input-classic" placeholder="Min. 6 karakter" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-1.5">Role</label>
                <select className="input-classic" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-5 h-5 border-2 border-cream-300 border-t-transparent rounded-full animate-spin" />Memproses...</>
                  : '✅ Daftar Sekarang'}
              </button>
            </form>
            <p className="text-center text-wood-400 text-sm mt-5">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-wood-600 font-semibold hover:text-wood-800 underline">Masuk</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
