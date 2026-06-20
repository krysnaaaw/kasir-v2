import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import api from '../services/api';
import { formatRupiah, getStockStatus, getImageUrl } from '../utils/helpers';

// Modal Component
const Modal = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 25 }}
          className="relative bg-cream-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
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

const ProductForm = ({ initial, categories, onSubmit, loading, onClose }) => {
  const [form, setForm] = useState(initial || { category_id: '', nama_produk: '', deskripsi: '', harga_beli: '', harga_jual: '', stok: '', stok_minimum: '5', satuan: 'pcs' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.gambar ? getImageUrl(initial.gambar) : null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (imageFile) fd.append('gambar', imageFile);
    onSubmit(fd);
  };

  const margin = form.harga_beli && form.harga_jual
    ? (((form.harga_jual - form.harga_beli) / form.harga_beli) * 100).toFixed(1)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-wood-700 text-sm font-semibold mb-1.5">Kategori *</label>
        <select className="input-classic" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
          <option value="">-- Pilih Kategori --</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-wood-700 text-sm font-semibold mb-1.5">Nama Produk *</label>
        <input className="input-classic" placeholder="Nama produk" value={form.nama_produk}
          onChange={e => setForm({ ...form, nama_produk: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-wood-700 text-sm font-semibold mb-1.5">Harga Beli</label>
          <input type="number" className="input-classic" placeholder="0" value={form.harga_beli}
            onChange={e => setForm({ ...form, harga_beli: e.target.value })} min="0" />
        </div>
        <div>
          <label className="block text-wood-700 text-sm font-semibold mb-1.5">Harga Jual *</label>
          <input type="number" className="input-classic" placeholder="0" value={form.harga_jual}
            onChange={e => setForm({ ...form, harga_jual: e.target.value })} required min="0" />
        </div>
      </div>
      {margin && (
        <p className="text-xs text-green-600 font-semibold">💰 Estimasi Margin: {margin}%</p>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-wood-700 text-sm font-semibold mb-1.5">Stok</label>
          <input type="number" className="input-classic" placeholder="0" value={form.stok}
            onChange={e => setForm({ ...form, stok: e.target.value })} min="0" />
        </div>
        <div>
          <label className="block text-wood-700 text-sm font-semibold mb-1.5">Stok Min</label>
          <input type="number" className="input-classic" placeholder="5" value={form.stok_minimum}
            onChange={e => setForm({ ...form, stok_minimum: e.target.value })} min="0" />
        </div>
        <div>
          <label className="block text-wood-700 text-sm font-semibold mb-1.5">Satuan</label>
          <select className="input-classic" value={form.satuan} onChange={e => setForm({ ...form, satuan: e.target.value })}>
            {['pcs', 'botol', 'kaleng', 'kotak', 'bungkus', 'karung', 'kg', 'gram', 'liter', 'ml', 'buah', 'tube', 'batang', 'strip', 'sachet', 'cup'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-wood-700 text-sm font-semibold mb-1.5">Foto Produk</label>
        <input type="file" accept="image/*" onChange={handleImage} className="input-classic text-sm" />
        {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-cream-200" />}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-cream-300 border-t-transparent rounded-full animate-spin" /> : null}
          {initial ? 'Simpan Perubahan' : 'Tambah Produk'}
        </button>
      </div>
    </form>
  );
};

const BarcodeModal = ({ product, onClose }) => {
  const svgRef = useRef();
  useEffect(() => {
    if (product && svgRef.current) {
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128', displayValue: true, fontSize: 12,
        width: 2, height: 60, margin: 10
      });
    }
  }, [product]);

  const handlePrint = () => {
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Barcode - ${product.nama_produk}</title>
      <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;font-family:sans-serif;}
      .card{text-align:center;padding:20px;border:1px solid #ccc;border-radius:8px;}</style></head>
      <body><div class="card">
        <p style="font-weight:bold;margin-bottom:8px">${product.nama_produk}</p>
        ${svgData}
        <p style="margin-top:4px;color:#666;font-size:12px">${product.kode_produk}</p>
      </div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal open={!!product} onClose={onClose} title="Preview Barcode">
      {product && (
        <div className="text-center space-y-4">
          <p className="font-semibold text-wood-700">{product.nama_produk}</p>
          <div className="bg-white p-4 rounded-xl border border-cream-200 inline-block">
            <svg ref={svgRef} />
          </div>
          <p className="text-xs text-wood-400 font-mono">{product.barcode}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Tutup</button>
            <button onClick={handlePrint} className="btn-primary flex-1">🖨️ Cetak</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const InventoriPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', category_id: '', status: '', page: 1, limit: 10, sort: 'id', order: 'DESC' });
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const searchTimeout = useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/products?${params}`);
      if (data.success) { setProducts(data.data); setMeta(data.meta); }
    } catch { toast.error('Gagal memuat produk'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => { if (data.success) setCategories(data.data); });
  }, []);

  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val, page: 1 }));
    }, 400);
  };

  const handleCreate = async (fd) => {
    setFormLoading(true);
    try {
      const { data } = await api.post('/products', fd);
      if (data.success) { toast.success(data.message); setShowForm(false); fetchProducts(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menambahkan produk'); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (fd) => {
    setFormLoading(true);
    try {
      const { data } = await api.put(`/products/${editProduct.id}`, fd);
      if (data.success) { toast.success(data.message); setEditProduct(null); fetchProducts(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal memperbarui produk'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/products/${deleteConfirm.id}`);
      if (data.success) { toast.success(data.message); setDeleteConfirm(null); fetchProducts(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus produk'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Inventori</h1>
          <p className="text-wood-400 text-sm">{meta.total} produk terdaftar</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Tambah Produk</button>
      </div>

      {/* Filters */}
      <div className="card-classic p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input className="input-classic" placeholder="🔍 Cari produk, barcode..." defaultValue={filters.search}
            onChange={e => handleSearch(e.target.value)} />
          <select className="input-classic" value={filters.category_id}
            onChange={e => setFilters(f => ({ ...f, category_id: e.target.value, page: 1 }))}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
          <select className="input-classic" value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">Semua Status</option>
            <option value="aman">Stok Aman</option>
            <option value="hampir">Hampir Habis</option>
            <option value="habis">Habis</option>
          </select>
          <select className="input-classic" value={filters.sort + '_' + filters.order}
            onChange={e => { const [s, o] = e.target.value.split('_'); setFilters(f => ({ ...f, sort: s, order: o })); }}>
            <option value="id_DESC">Terbaru</option>
            <option value="nama_produk_ASC">Nama A-Z</option>
            <option value="harga_jual_ASC">Harga Terendah</option>
            <option value="harga_jual_DESC">Harga Tertinggi</option>
            <option value="stok_ASC">Stok Terendah</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-classic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-classic">
            <thead>
              <tr>
                <th>Produk</th>
                <th className="hidden md:table-cell">Kategori</th>
                <th>Harga</th>
                <th className="hidden sm:table-cell">Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-full rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-wood-400">Tidak ada produk ditemukan</p>
                  </td>
                </tr>
              ) : products.map(p => {
                const status = getStockStatus(p.stok, p.stok_minimum);
                const margin = p.harga_beli > 0 ? (((p.harga_jual - p.harga_beli) / p.harga_beli) * 100).toFixed(0) : null;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cream-100 border border-cream-200 overflow-hidden flex-shrink-0">
                          {p.gambar
                            ? <img src={getImageUrl(p.gambar)} alt={p.nama_produk} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-wood-800 text-sm">{p.nama_produk}</p>
                          <p className="text-xs text-wood-400 font-mono">{p.kode_produk}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="badge-wood">{p.kategori_nama}</span>
                    </td>
                    <td>
                      <p className="font-semibold text-wood-700">{formatRupiah(p.harga_jual)}</p>
                      {margin && <p className="text-xs text-green-600">+{margin}%</p>}
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="font-semibold">{p.stok}</span>
                      <span className="text-wood-400 text-xs ml-1">{p.satuan}</span>
                    </td>
                    <td><span className={status.class}>{status.label}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setBarcodeProduct(p)} title="Barcode"
                          className="p-1.5 text-wood-400 hover:text-wood-700 hover:bg-cream-100 rounded-lg transition-colors text-base">
                          ▦
                        </button>
                        <button onClick={() => setEditProduct(p)} title="Edit"
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm">
                          ✏️
                        </button>
                        <button onClick={() => setDeleteConfirm(p)} title="Hapus"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-cream-100">
            <p className="text-wood-400 text-sm">Halaman {filters.page} dari {meta.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">← Prev</button>
              <button disabled={filters.page >= meta.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Produk">
        <ProductForm categories={categories} onSubmit={handleCreate} loading={formLoading} onClose={() => setShowForm(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Produk">
        {editProduct && (
          <ProductForm initial={editProduct} categories={categories} onSubmit={handleUpdate}
            loading={formLoading} onClose={() => setEditProduct(null)} />
        )}
      </Modal>

      {/* Barcode Modal */}
      <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
        {deleteConfirm && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🗑️</div>
            <p className="text-wood-700">Hapus produk <strong>{deleteConfirm.nama_produk}</strong>?</p>
            <p className="text-wood-400 text-sm">Produk tidak akan tampil di sistem (soft delete).</p>
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

export default InventoriPage;
