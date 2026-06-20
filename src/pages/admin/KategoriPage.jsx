import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Modal = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 25 }}
          className="relative bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md z-10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-wood-800 rounded-t-2xl">
            <h2 className="font-display text-cream-100 text-xl">{title}</h2>
            <button onClick={onClose} className="text-wood-300 hover:text-cream-100 text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const KategoriPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ nama: '', deskripsi: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      if (data.success) setCategories(data.data);
    } catch { toast.error('Gagal memuat kategori'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm({ nama: '', deskripsi: '' }); setShowForm(true); };
  const openEdit = (cat) => { setEditCat(cat); setForm({ nama: cat.nama, deskripsi: cat.deskripsi || '' }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) return toast.error('Nama kategori wajib diisi');
    setFormLoading(true);
    try {
      if (editCat) {
        const { data } = await api.put(`/categories/${editCat.id}`, form);
        if (data.success) { toast.success(data.message); setEditCat(null); fetch(); }
      } else {
        const { data } = await api.post('/categories', form);
        if (data.success) { toast.success(data.message); setShowForm(false); fetch(); }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/categories/${deleteConfirm.id}`);
      if (data.success) { toast.success(data.message); setDeleteConfirm(null); fetch(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus kategori'); }
  };

  const ICONS = ['🛒', '🍎', '🥤', '🍕', '🧴', '✏️', '❄️', '💊', '🏷️', '📦'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Kategori</h1>
          <p className="text-wood-400 text-sm">{categories.length} kategori terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Tambah Kategori</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-classic p-5 space-y-3">
              <div className="skeleton h-6 w-32 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card-classic p-16 text-center">
          <div className="text-5xl mb-3">🏷️</div>
          <p className="text-wood-400 font-semibold">Belum ada kategori</p>
          <button onClick={openAdd} className="btn-primary mt-4">Tambah Kategori Pertama</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card-classic p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-wood-100 flex items-center justify-center text-xl">
                    {ICONS[i % ICONS.length]}
                  </div>
                  <div>
                    <h3 className="font-display text-wood-800 text-lg">{cat.nama}</h3>
                    <p className="text-wood-400 text-xs">{cat.total_produk} produk</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)}
                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm">✏️</button>
                  <button onClick={() => setDeleteConfirm(cat)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">🗑️</button>
                </div>
              </div>
              {cat.deskripsi && <p className="text-wood-500 text-sm">{cat.deskripsi}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showForm || !!editCat} onClose={() => { setShowForm(false); setEditCat(null); }}
        title={editCat ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-wood-700 text-sm font-semibold mb-1.5">Nama Kategori *</label>
            <input className="input-classic" placeholder="Nama kategori" value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="block text-wood-700 text-sm font-semibold mb-1.5">Deskripsi</label>
            <textarea className="input-classic resize-none" rows={3} placeholder="Deskripsi opsional"
              value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditCat(null); }} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {formLoading && <div className="w-4 h-4 border-2 border-cream-300 border-t-transparent rounded-full animate-spin" />}
              {editCat ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
        {deleteConfirm && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🗑️</div>
            <p className="text-wood-700">Hapus kategori <strong>{deleteConfirm.nama}</strong>?</p>
            <p className="text-wood-400 text-sm">Pastikan tidak ada produk aktif di kategori ini.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Hapus</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KategoriPage;
