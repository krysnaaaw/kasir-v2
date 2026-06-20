import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatDateShort } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const Modal = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 25 }}
          className="relative bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md z-10">
          <div className="flex items-center justify-between px-6 py-4 bg-wood-800 rounded-t-2xl">
            <h2 className="font-display text-cream-100 text-xl">{title}</h2>
            <button onClick={onClose} className="text-wood-300 hover:text-cream-100 text-2xl">&times;</button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const PenggunaPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'kasir', is_active: 1 });
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      if (data.success) setUsers(data.data);
    } catch { toast.error('Gagal memuat pengguna'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setForm({ nama: '', email: '', password: '', role: 'kasir', is_active: 1 }); setShowForm(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ nama: u.nama, email: u.email, password: '', role: u.role, is_active: u.is_active }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editUser) {
        const payload = { nama: form.nama, email: form.email, role: form.role, is_active: form.is_active };
        const { data } = await api.put(`/users/${editUser.id}`, payload);
        if (data.success) { toast.success(data.message); setEditUser(null); fetchUsers(); }
      } else {
        const { data } = await api.post('/users', form);
        if (data.success) { toast.success(data.message); setShowForm(false); fetchUsers(); }
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan pengguna'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/users/${deleteConfirm.id}`);
      if (data.success) { toast.success(data.message); setDeleteConfirm(null); fetchUsers(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus pengguna'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Pengguna</h1>
          <p className="text-wood-400 text-sm">{users.length} pengguna terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Tambah Pengguna</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(3)].map((_, i) => (
          <div key={i} className="card-classic p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        )) : users.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="card-classic p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${u.role === 'admin' ? 'bg-gold-400 text-wood-800' : 'bg-wood-200 text-wood-700'}`}>
                  {u.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-wood-800">{u.nama}</p>
                  <p className="text-wood-400 text-xs">{u.email}</p>
                </div>
              </div>
              {u.id !== currentUser.id && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-sm">✏️</button>
                  <button onClick={() => setDeleteConfirm(u)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm">🗑️</button>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={u.role === 'admin' ? 'badge-warning' : 'badge-info'}>{u.role}</span>
              <span className={u.is_active ? 'badge-success' : 'badge-danger'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
              {u.id === currentUser.id && <span className="text-xs text-wood-400">(Anda)</span>}
            </div>
            <p className="text-wood-400 text-xs mt-2">Bergabung: {formatDateShort(u.created_at)}</p>
          </motion.div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal open={showForm || !!editUser} onClose={() => { setShowForm(false); setEditUser(null); }}
        title={editUser ? 'Edit Pengguna' : 'Tambah Pengguna'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-wood-700 text-sm font-semibold mb-1.5">Nama Lengkap *</label>
            <input className="input-classic" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
          </div>
          <div>
            <label className="block text-wood-700 text-sm font-semibold mb-1.5">Email *</label>
            <input type="email" className="input-classic" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          {!editUser && (
            <div>
              <label className="block text-wood-700 text-sm font-semibold mb-1.5">Password *</label>
              <input type="password" className="input-classic" placeholder="Min. 6 karakter" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-wood-700 text-sm font-semibold mb-1.5">Role</label>
              <select className="input-classic" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {editUser && (
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-1.5">Status</label>
                <select className="input-classic" value={form.is_active} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}>
                  <option value={1}>Aktif</option>
                  <option value={0}>Nonaktif</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {formLoading && <div className="w-4 h-4 border-2 border-cream-300 border-t-transparent rounded-full animate-spin" />}
              {editUser ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Nonaktifkan Pengguna">
        {deleteConfirm && (
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <p className="text-wood-700">Nonaktifkan akun <strong>{deleteConfirm.nama}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Nonaktifkan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PenggunaPage;
