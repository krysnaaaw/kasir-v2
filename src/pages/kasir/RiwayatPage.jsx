import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatRupiah, formatDate, getMetodeLabel, getOfflineTransactions } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const Modal = ({ open, onClose, title, children, size = 'lg' }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 25 }}
          className={`relative bg-cream-50 rounded-2xl shadow-2xl w-full z-10 max-h-[90vh] overflow-y-auto ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="flex items-center justify-between px-6 py-4 bg-wood-800 rounded-t-2xl sticky top-0">
            <h2 className="font-display text-cream-100 text-xl">{title}</h2>
            <button onClick={onClose} className="text-wood-300 hover:text-cream-100 text-2xl">&times;</button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const RiwayatPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', metode: '', date_start: '', date_end: '', page: 1, limit: 15 });
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [showStruk, setShowStruk] = useState(false);
  const offlineTrx = getOfflineTransactions();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/transactions?${params}`);
      if (data.success) { setTransactions(data.data); setMeta(data.meta); }
    } catch { toast.error('Gagal memuat riwayat'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openDetail = async (trx) => {
    try {
      const { data } = await api.get(`/transactions/${trx.id}`);
      if (data.success) setSelectedTrx(data.data);
    } catch { toast.error('Gagal memuat detail'); }
  };

  const handlePrintStruk = () => {
    const content = document.getElementById('struk-riwayat');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Struk ${selectedTrx?.nomor_transaksi}</title>
      <style>body{margin:0;padding:20px;font-family:monospace;font-size:12px;}</style>
      </head><body>${content.innerHTML}</body></html>`);
    win.document.close(); win.print();
  };

  const paidTransactions = transactions.filter(t => t.status === 'paid');
  const totalRevenue = paidTransactions.reduce((s, t) => s + parseFloat(t.total), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Riwayat Transaksi</h1>
          <p className="text-wood-400 text-sm">{meta.total} transaksi</p>
        </div>
      </div>

      {/* Offline warning */}
      {offlineTrx.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card-classic p-4 border-l-4 border-amber-400 bg-amber-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">{offlineTrx.length} Transaksi Offline Tersimpan</p>
              <p className="text-amber-600 text-sm">Transaksi ini belum tersinkronisasi ke server. Hubungi admin untuk sinkronisasi manual.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-classic p-4 text-center">
          <p className="text-wood-400 text-xs font-semibold uppercase">Transaksi</p>
          <p className="font-display text-wood-700 text-2xl">{paidTransactions.length}</p>
        </div>
        <div className="card-classic p-4 text-center">
          <p className="text-wood-400 text-xs font-semibold uppercase">Pendapatan</p>
          <p className="font-display text-wood-700 text-xl">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="card-classic p-4 text-center">
          <p className="text-wood-400 text-xs font-semibold uppercase">Rata-rata</p>
          <p className="font-display text-wood-700 text-xl">{formatRupiah(paidTransactions.length ? totalRevenue / paidTransactions.length : 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-classic p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input className="input-classic" placeholder="🔍 No. transaksi..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
          <select className="input-classic" value={filters.metode} onChange={e => setFilters(f => ({ ...f, metode: e.target.value, page: 1 }))}>
            <option value="">Semua Metode</option>
            {['tunai', 'transfer', 'debit', 'kredit', 'ewallet'].map(m => <option key={m} value={m}>{getMetodeLabel(m)}</option>)}
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
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton h-4 w-full rounded" /></td>)}</tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="text-4xl mb-2">🧾</div>
                  <p className="text-wood-400">Belum ada transaksi</p>
                </td></tr>
              ) : transactions.map(t => (
                <tr key={t.id}>
                  <td><p className="font-mono text-xs font-semibold text-wood-700">{t.nomor_transaksi}</p></td>
                  <td className="hidden sm:table-cell"><p className="text-sm">{t.kasir_nama}</p></td>
                  <td><p className="font-semibold text-wood-700">{formatRupiah(t.total)}</p></td>
                  <td className="hidden md:table-cell">
                    <span className="badge-wood">{getMetodeLabel(t.metode_pembayaran)}</span>
                  </td>
                  <td>
                    <span className={t.status === 'paid' ? 'badge-success' : 'badge-danger'}>
                      {t.status === 'paid' ? 'Lunas' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell"><p className="text-xs text-wood-400">{formatDate(t.created_at)}</p></td>
                  <td>
                    <button onClick={() => openDetail(t)}
                      className="text-xs text-wood-500 hover:text-wood-700 hover:bg-cream-100 px-2 py-1 rounded transition-colors font-semibold">
                      Lihat →
                    </button>
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
      <Modal open={!!selectedTrx} onClose={() => setSelectedTrx(null)} title="Detail Transaksi">
        {selectedTrx && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-wood-400 text-xs">No. Transaksi</p><p className="font-mono font-semibold">{selectedTrx.nomor_transaksi}</p></div>
              <div><p className="text-wood-400 text-xs">Kasir</p><p className="font-semibold">{selectedTrx.kasir_nama}</p></div>
              <div><p className="text-wood-400 text-xs">Tanggal</p><p>{formatDate(selectedTrx.created_at)}</p></div>
              <div><p className="text-wood-400 text-xs">Metode</p><p>{getMetodeLabel(selectedTrx.metode_pembayaran)}</p></div>
            </div>
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
            <div className="bg-cream-100 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-wood-500">Subtotal</span><span>{formatRupiah(selectedTrx.subtotal)}</span></div>
              {selectedTrx.diskon > 0 && <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatRupiah(selectedTrx.diskon)}</span></div>}
              {selectedTrx.pajak > 0 && <div className="flex justify-between"><span>Pajak</span><span>{formatRupiah(selectedTrx.pajak)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t border-cream-300 pt-2"><span>Total</span><span>{formatRupiah(selectedTrx.total)}</span></div>
              <div className="flex justify-between"><span className="text-wood-500">Dibayar</span><span>{formatRupiah(selectedTrx.jumlah_bayar)}</span></div>
              {selectedTrx.kembalian > 0 && <div className="flex justify-between text-green-600"><span>Kembalian</span><span>{formatRupiah(selectedTrx.kembalian)}</span></div>}
            </div>

            {/* Hidden struk for printing */}
            <div id="struk-riwayat" className="hidden">
              <div style={{fontFamily:'monospace',fontSize:'12px',maxWidth:'300px'}}>
                <div style={{textAlign:'center',borderBottom:'1px dashed #ccc',paddingBottom:'8px',marginBottom:'8px'}}>
                  <p style={{fontWeight:'bold',fontSize:'14px'}}>POS KLASIK</p>
                  <p style={{color:'#666'}}>Terima kasih telah berbelanja!</p>
                </div>
                <p>No: {selectedTrx.nomor_transaksi}</p>
                <p>Kasir: {selectedTrx.kasir_nama}</p>
                <p>Tanggal: {formatDate(selectedTrx.created_at)}</p>
                <div style={{borderTop:'1px dashed #ccc',marginTop:'8px',paddingTop:'8px'}}>
                  {selectedTrx.items?.map((item, i) => (
                    <div key={i}>
                      <p style={{fontWeight:'bold'}}>{item.nama_produk}</p>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <span>{item.quantity}x {formatRupiah(item.harga_jual)}</span>
                        <span>{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:'1px dashed #ccc',marginTop:'8px',paddingTop:'8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:'bold',fontSize:'14px'}}>
                    <span>TOTAL</span><span>{formatRupiah(selectedTrx.total)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span>Bayar ({getMetodeLabel(selectedTrx.metode_pembayaran)})</span><span>{formatRupiah(selectedTrx.jumlah_bayar)}</span>
                  </div>
                  {selectedTrx.kembalian > 0 && (
                    <div style={{display:'flex',justifyContent:'space-between',color:'green'}}>
                      <span>Kembalian</span><span>{formatRupiah(selectedTrx.kembalian)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedTrx(null)} className="btn-secondary flex-1">Tutup</button>
              <button onClick={handlePrintStruk} className="btn-primary flex-1">🖨️ Cetak Ulang</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RiwayatPage;
