import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatRupiah, formatDate, getMetodeLabel } from '../../utils/helpers';

const Modal = ({ open, onClose, title, children, size = 'md' }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 25 }}
          className={`relative bg-cream-50 rounded-2xl shadow-2xl w-full z-10 max-h-[90vh] overflow-y-auto ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-wood-800 rounded-t-2xl sticky top-0">
            <h2 className="font-display text-cream-100 text-xl">{title}</h2>
            <button onClick={onClose} className="text-wood-300 hover:text-cream-100 text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const StrukPrint = ({ trx }) => {
  if (!trx) return null;
  return (
    <div id="struk-print" className="font-mono text-sm max-w-xs mx-auto bg-white p-4">
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
        <p className="font-bold text-lg">POS KLASIK</p>
        <p className="text-xs text-gray-500">Jl. Contoh No. 1, Kota</p>
        <p className="text-xs text-gray-500">Telp: 08123456789</p>
      </div>
      <div className="space-y-1 text-xs mb-3">
        <div className="flex justify-between"><span>No</span><span className="font-semibold">{trx.nomor_transaksi}</span></div>
        <div className="flex justify-between"><span>Tanggal</span><span>{formatDate(trx.created_at)}</span></div>
        <div className="flex justify-between"><span>Kasir</span><span>{trx.kasir_nama}</span></div>
      </div>
      <div className="border-t border-dashed border-gray-400 py-3 space-y-1.5">
        {trx.items?.map((item, i) => (
          <div key={i}>
            <p className="font-semibold">{item.nama_produk}</p>
            <div className="flex justify-between text-gray-600">
              <span>{item.quantity} x {formatRupiah(item.harga_jual)}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-dashed border-gray-400 pt-3 space-y-1 text-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(trx.subtotal)}</span></div>
        {trx.diskon > 0 && <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatRupiah(trx.diskon)}</span></div>}
        {trx.pajak > 0 && <div className="flex justify-between"><span>Pajak</span><span>{formatRupiah(trx.pajak)}</span></div>}
        <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-1">
          <span>TOTAL</span><span>{formatRupiah(trx.total)}</span>
        </div>
        <div className="flex justify-between"><span>Dibayar ({getMetodeLabel(trx.metode_pembayaran)})</span><span>{formatRupiah(trx.jumlah_bayar)}</span></div>
        {trx.kembalian > 0 && <div className="flex justify-between"><span>Kembalian</span><span>{formatRupiah(trx.kembalian)}</span></div>}
      </div>
      <div className="text-center mt-4 text-xs text-gray-500 border-t border-dashed border-gray-400 pt-3">
        <p>Terima kasih telah berbelanja!</p>
        <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
      </div>
    </div>
  );
};

const TransaksiPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', metode: '', status: '', date_start: '', date_end: '', page: 1, limit: 15 });
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [showStruk, setShowStruk] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [stats, setStats] = useState({ total: 0, revenue: 0, avg: 0 });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/transactions?${params}`);
      if (data.success) {
        setTransactions(data.data);
        setMeta(data.meta);
        const paid = data.data.filter(t => t.status === 'paid');
        const revenue = paid.reduce((s, t) => s + parseFloat(t.total), 0);
        setStats({ total: paid.length, revenue, avg: paid.length ? revenue / paid.length : 0 });
      }
    } catch { toast.error('Gagal memuat transaksi'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openDetail = async (trx) => {
    try {
      const { data } = await api.get(`/transactions/${trx.id}`);
      if (data.success) setSelectedTrx(data.data);
    } catch { toast.error('Gagal memuat detail'); }
  };

  const handleCancel = async () => {
    try {
      const { data } = await api.patch(`/transactions/${cancelConfirm.id}/cancel`);
      if (data.success) { toast.success(data.message); setCancelConfirm(null); fetchTransactions(); if (selectedTrx?.id === cancelConfirm.id) setSelectedTrx(null); }
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal membatalkan transaksi'); }
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams({ date_start: filters.date_start, date_end: filters.date_end });
      const response = await api.get(`/transactions/export/csv?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url; a.download = `transaksi_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export CSV berhasil');
    } catch { toast.error('Gagal export CSV'); }
  };

  const handlePrintStruk = () => {
    const content = document.getElementById('struk-print');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Struk</title>
      <style>body{margin:0;padding:20px;font-family:monospace;}@media print{body{padding:0;}}</style>
      </head><body>${content.innerHTML}</body></html>`);
    win.document.close(); win.print();
  };

  const METODE_COLORS = { tunai: 'badge-success', transfer: 'badge-info', debit: 'badge-wood', kredit: 'badge-warning', ewallet: 'badge-info' };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Riwayat Transaksi</h1>
          <p className="text-wood-400 text-sm">{meta.total} transaksi</p>
        </div>
        <button onClick={handleExportCsv} className="btn-secondary flex items-center gap-2">📥 Export CSV</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-classic p-4 text-center">
          <p className="text-wood-400 text-xs font-semibold uppercase">Transaksi</p>
          <p className="font-display text-wood-700 text-2xl">{stats.total}</p>
        </div>
        <div className="card-classic p-4 text-center">
          <p className="text-wood-400 text-xs font-semibold uppercase">Total</p>
          <p className="font-display text-wood-700 text-xl">{formatRupiah(stats.revenue)}</p>
        </div>
        <div className="card-classic p-4 text-center">
          <p className="text-wood-400 text-xs font-semibold uppercase">Rata-rata</p>
          <p className="font-display text-wood-700 text-xl">{formatRupiah(stats.avg)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-classic p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input className="input-classic" placeholder="🔍 No. transaksi / kasir" value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
          <select className="input-classic" value={filters.metode} onChange={e => setFilters(f => ({ ...f, metode: e.target.value, page: 1 }))}>
            <option value="">Semua Metode</option>
            {['tunai','transfer','debit','kredit','ewallet'].map(m => <option key={m} value={m}>{getMetodeLabel(m)}</option>)}
          </select>
          <select className="input-classic" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          <input type="date" className="input-classic" value={filters.date_start} onChange={e => setFilters(f => ({ ...f, date_start: e.target.value, page: 1 }))} />
          <input type="date" className="input-classic" value={filters.date_end} onChange={e => setFilters(f => ({ ...f, date_end: e.target.value, page: 1 }))} />
        </div>
      </div>

      {/* Table */}
      <div className="card-classic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-classic">
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th className="hidden sm:table-cell">Kasir</th>
                <th>Total</th>
                <th className="hidden md:table-cell">Metode</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton h-4 w-full rounded" /></td>)}</tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="text-4xl mb-2">🧾</div>
                  <p className="text-wood-400">Tidak ada transaksi ditemukan</p>
                </td></tr>
              ) : transactions.map(t => (
                <tr key={t.id} className="cursor-pointer" onClick={() => openDetail(t)}>
                  <td><p className="font-mono text-xs font-semibold text-wood-700">{t.nomor_transaksi}</p></td>
                  <td className="hidden sm:table-cell"><p className="text-sm">{t.kasir_nama}</p></td>
                  <td><p className="font-semibold text-wood-700">{formatRupiah(t.total)}</p></td>
                  <td className="hidden md:table-cell">
                    <span className={METODE_COLORS[t.metode_pembayaran] || 'badge-wood'}>{getMetodeLabel(t.metode_pembayaran)}</span>
                  </td>
                  <td>
                    <span className={t.status === 'paid' ? 'badge-success' : 'badge-danger'}>
                      {t.status === 'paid' ? 'Lunas' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell"><p className="text-xs text-wood-400">{formatDate(t.created_at)}</p></td>
                  <td onClick={e => e.stopPropagation()}>
                    {t.status === 'paid' && (
                      <button onClick={() => setCancelConfirm(t)}
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                        Batalkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Detail Modal */}
      <Modal open={!!selectedTrx} onClose={() => setSelectedTrx(null)} title="Detail Transaksi" size="lg">
        {selectedTrx && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-wood-400 text-xs">No. Transaksi</p><p className="font-mono font-semibold">{selectedTrx.nomor_transaksi}</p></div>
              <div><p className="text-wood-400 text-xs">Kasir</p><p className="font-semibold">{selectedTrx.kasir_nama}</p></div>
              <div><p className="text-wood-400 text-xs">Tanggal</p><p>{formatDate(selectedTrx.created_at)}</p></div>
              <div><p className="text-wood-400 text-xs">Metode</p><p>{getMetodeLabel(selectedTrx.metode_pembayaran)}</p></div>
            </div>
            <div>
              <h3 className="font-semibold text-wood-700 mb-2 text-sm">Item Pembelian</h3>
              <div className="rounded-xl overflow-hidden border border-cream-200">
                <table className="w-full text-sm">
                  <thead className="bg-wood-700 text-cream-100">
                    <tr><th className="text-left px-3 py-2">Produk</th><th className="text-center px-3 py-2">Qty</th><th className="text-right px-3 py-2">Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {selectedTrx.items?.map((item, i) => (
                      <tr key={i} className="border-b border-cream-100">
                        <td className="px-3 py-2">{item.nama_produk}<br /><span className="text-xs text-wood-400">{formatRupiah(item.harga_jual)}/pcs</span></td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-cream-100 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-wood-500">Subtotal</span><span>{formatRupiah(selectedTrx.subtotal)}</span></div>
              {selectedTrx.diskon > 0 && <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatRupiah(selectedTrx.diskon)}</span></div>}
              {selectedTrx.pajak > 0 && <div className="flex justify-between"><span>Pajak</span><span>{formatRupiah(selectedTrx.pajak)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-cream-300"><span>Total</span><span>{formatRupiah(selectedTrx.total)}</span></div>
              <div className="flex justify-between"><span className="text-wood-500">Dibayar</span><span>{formatRupiah(selectedTrx.jumlah_bayar)}</span></div>
              {selectedTrx.kembalian > 0 && <div className="flex justify-between text-green-600"><span>Kembalian</span><span>{formatRupiah(selectedTrx.kembalian)}</span></div>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedTrx(null)} className="btn-secondary flex-1">Tutup</button>
              <button onClick={() => { setShowStruk(true); }} className="btn-primary flex-1">🖨️ Cetak Struk</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Struk print modal */}
      <Modal open={showStruk} onClose={() => setShowStruk(false)} title="Preview Struk">
        {selectedTrx && (
          <div className="space-y-4">
            <StrukPrint trx={selectedTrx} />
            <div className="flex gap-3 no-print">
              <button onClick={() => setShowStruk(false)} className="btn-secondary flex-1">Tutup</button>
              <button onClick={handlePrintStruk} className="btn-primary flex-1">🖨️ Print</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel confirm */}
      <Modal open={!!cancelConfirm} onClose={() => setCancelConfirm(null)} title="Batalkan Transaksi">
        {cancelConfirm && (
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <p className="text-wood-700">Batalkan transaksi <strong>{cancelConfirm.nomor_transaksi}</strong>?</p>
            <p className="text-wood-400 text-sm">Stok produk akan dikembalikan secara otomatis.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelConfirm(null)} className="btn-secondary flex-1">Tidak</button>
              <button onClick={handleCancel} className="btn-danger flex-1">Ya, Batalkan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransaksiPage;
