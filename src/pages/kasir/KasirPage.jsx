import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { formatRupiah, getImageUrl, saveOfflineTransaction } from '../utils/helpers';

const METODE = [
  { value: 'tunai',    label: 'Tunai',        icon: '💵' },
  { value: 'transfer', label: 'Transfer Bank', icon: '🏦' },
  { value: 'debit',    label: 'Debit',         icon: '💳' },
  { value: 'kredit',   label: 'Kredit',        icon: '💳' },
  { value: 'ewallet',  label: 'E-Wallet',      icon: '📱' },
];

// ============================================
// CHECKOUT MODAL
// ============================================
const CheckoutModal = ({ open, onClose, onSuccess }) => {
  const { items, subtotal, diskon, pajakVal, total, clearCart, ATURAN } = useCart();

  const [metode, setMetode]         = useState('tunai');
  const [namaMetode, setNamaMetode] = useState('');
  const [bayar, setBayar]           = useState('');
  const [catatan, setCatatan]       = useState('');
  const [loading, setLoading]       = useState(false);

  const kembalian = metode === 'tunai' ? (parseFloat(bayar) || 0) - total : 0;
  const promoAktif = subtotal >= ATURAN.DISKON_MIN_BELANJA;

  const handleCheckout = async () => {
    if (metode === 'tunai' && (parseFloat(bayar) || 0) < total) {
      return toast.error('Jumlah bayar kurang dari total');
    }
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        diskon,
        pajak: pajakVal,
        metode_pembayaran: metode,
        nama_metode: namaMetode || METODE.find(m => m.value === metode)?.label,
        jumlah_bayar: metode === 'tunai' ? parseFloat(bayar) : total,
        catatan,
      };
      const { data } = await api.post('/transactions', payload);
      if (data.success) {
        toast.success('Transaksi berhasil!');
        clearCart();
        onSuccess(data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Transaksi gagal';
      toast.error(msg);
      if (!err.response) {
        saveOfflineTransaction({ items, subtotal, diskon, pajak: pajakVal, total, metode, bayar, catatan });
        toast('Transaksi disimpan offline', { icon: '⚠️' });
      }
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 25 }}
          className="relative bg-cream-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto z-10"
        >
          {/* Header */}
          <div className="bg-wood-800 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <h2 className="font-display text-cream-100 text-xl">Pembayaran</h2>
            <button onClick={onClose} className="text-wood-300 hover:text-cream-100 text-2xl">&times;</button>
          </div>

          <div className="p-6 space-y-5">

            {/* Ringkasan item */}
            <div className="bg-cream-100 rounded-xl p-4 space-y-1.5 text-sm max-h-40 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-wood-600">
                    {item.nama_produk}
                    <span className="text-wood-400 ml-1">×{item.quantity}</span>
                  </span>
                  <span className="font-semibold">{formatRupiah(item.harga_jual * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Banner promo otomatis */}
            {promoAktif && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3"
              >
                <p className="text-amber-800 text-xs font-bold uppercase tracking-wide mb-1">
                  🎉 Promo Otomatis Aktif
                </p>
                <div className="flex gap-4 text-sm text-amber-700">
                  <span>✅ Diskon <strong>{ATURAN.DISKON_PERSEN}%</strong></span>
                  <span>✅ PPN <strong>{ATURAN.PPN_PERSEN}%</strong></span>
                </div>
              </motion.div>
            )}

            {/* Ringkasan harga */}
            <div className="bg-wood-800 text-cream-100 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-wood-300">Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {diskon > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Diskon {ATURAN.DISKON_PERSEN}% otomatis</span>
                  <span>− {formatRupiah(diskon)}</span>
                </div>
              )}
              {pajakVal > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>PPN {ATURAN.PPN_PERSEN}% otomatis</span>
                  <span>+ {formatRupiah(pajakVal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-2 border-t border-wood-600">
                <span>TOTAL</span>
                <span className="text-gold-400">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Metode pembayaran */}
            <div>
              <label className="block text-wood-700 text-sm font-semibold mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {METODE.map(m => (
                  <button key={m.value} type="button" onClick={() => setMetode(m.value)}
                    className={`flex flex-col items-center py-2.5 px-2 rounded-xl border-2 transition-all text-xs font-semibold
                    ${metode === m.value
                      ? 'border-wood-600 bg-wood-100 text-wood-700'
                      : 'border-cream-200 bg-white text-wood-400 hover:border-wood-300'}`}>
                    <span className="text-xl mb-1">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nama bank/ewallet */}
            {metode !== 'tunai' && (
              <div>
                <label className="block text-wood-700 text-xs font-semibold mb-1">
                  Nama Bank / Dompet
                </label>
                <input className="input-classic"
                  placeholder="e.g. BCA, BNI, GoPay, OVO..."
                  value={namaMetode} onChange={e => setNamaMetode(e.target.value)} />
              </div>
            )}

            {/* Jumlah bayar (tunai) */}
            {metode === 'tunai' && (
              <div>
                <label className="block text-wood-700 text-sm font-semibold mb-2">
                  Jumlah Bayar
                </label>
                <input
                  type="number"
                  className="input-classic text-lg font-bold"
                  placeholder={`Min. ${formatRupiah(total)}`}
                  value={bayar}
                  onChange={e => setBayar(e.target.value)}
                  min={total}
                />
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[total,
                    Math.ceil(total / 10000) * 10000,
                    Math.ceil(total / 50000) * 50000,
                    Math.ceil(total / 100000) * 100000,
                  ]
                    .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                    .slice(0, 4)
                    .map(v => (
                      <button key={v} onClick={() => setBayar(String(v))}
                        className="text-xs py-1.5 px-3 bg-cream-100 hover:bg-cream-200 text-wood-600 font-semibold rounded-lg border border-cream-200 transition-colors">
                        {formatRupiah(v)}
                      </button>
                    ))}
                </div>
                {parseFloat(bayar) >= total && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-green-700 font-bold text-sm">
                      Kembalian: {formatRupiah(kembalian)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Catatan */}
            <div>
              <label className="block text-wood-700 text-xs font-semibold mb-1">
                Catatan (opsional)
              </label>
              <input className="input-classic" placeholder="Catatan transaksi..."
                value={catatan} onChange={e => setCatatan(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
              <button
                onClick={handleCheckout}
                disabled={loading || items.length === 0}
                className="btn-gold flex-1 flex items-center justify-center gap-2 text-base py-3"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-wood-800 border-t-transparent rounded-full animate-spin" />
                  : '✅'}
                {loading ? 'Memproses...' : `Bayar ${formatRupiah(total)}`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================
// STRUK SUCCESS MODAL
// ============================================
const StrukSuccessModal = ({ trx, onClose }) => {
  if (!trx) return null;

  const handlePrint = () => {
    const content = document.getElementById('struk-success');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Struk</title>
      <style>body{margin:0;padding:20px;font-family:monospace;font-size:12px;}
      @media print{body{padding:0;}}</style></head>
      <body>${content.innerHTML}</body></html>`);
    win.document.close(); win.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative bg-cream-50 rounded-2xl shadow-2xl w-full max-w-sm max-h-[95vh] overflow-y-auto z-10"
        >
          <div className="bg-green-600 px-6 py-5 rounded-t-2xl text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="font-display text-white text-2xl">Transaksi Berhasil!</h2>
            <p className="text-green-100 text-sm mt-1">{trx.nomor_transaksi}</p>
          </div>
          <div className="p-5">
            <div id="struk-success" className="font-mono text-xs bg-white p-4 rounded-xl border border-cream-200 mb-4">
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                <p className="font-bold text-sm">POS KLASIK</p>
                <p className="text-gray-500">Terima kasih telah berbelanja!</p>
              </div>
              <div className="space-y-1 mb-2">
                <div className="flex justify-between"><span>No</span><span className="font-semibold">{trx.nomor_transaksi}</span></div>
                <div className="flex justify-between"><span>Kasir</span><span>{trx.kasir_nama}</span></div>
              </div>
              <div className="border-t border-dashed border-gray-400 py-2 space-y-1">
                {trx.items?.map((item, i) => (
                  <div key={i}>
                    <p className="font-semibold">{item.nama_produk}</p>
                    <div className="flex justify-between text-gray-500">
                      <span>{item.quantity}x {formatRupiah(item.harga_jual)}</span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span><span>{formatRupiah(trx.subtotal)}</span>
                </div>
                {trx.diskon > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span><span>− {formatRupiah(trx.diskon)}</span>
                  </div>
                )}
                {trx.pajak > 0 && (
                  <div className="flex justify-between">
                    <span>PPN</span><span>+ {formatRupiah(trx.pajak)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1">
                  <span>TOTAL</span><span>{formatRupiah(trx.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dibayar</span><span>{formatRupiah(trx.jumlah_bayar)}</span>
                </div>
                {trx.kembalian > 0 && (
                  <div className="flex justify-between font-bold text-green-600">
                    <span>Kembalian</span><span>{formatRupiah(trx.kembalian)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Tutup</button>
              <button onClick={handlePrint} className="btn-primary flex-1">🖨️ Print Struk</button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================
// MAIN KASIR PAGE
// ============================================
const KasirPage = () => {
  const { items, addItem, removeItem, updateQty, subtotal, diskon, pajakVal, total, ATURAN } = useCart();
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [search, setSearch]             = useState('');
  const [selectedCat, setSelectedCat]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [successTrx, setSuccessTrx]     = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const searchTimeout = useRef(null);

  const promoAktif = subtotal >= ATURAN.DISKON_MIN_BELANJA;

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      if (data.success) setCategories(data.data);
    });
  }, []);

  const fetchProducts = useCallback(async (q = '', cat = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?search=${q}&category_id=${cat}&limit=24`);
      if (data.success) setProducts(data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchProducts(search, selectedCat), 350);
  }, [search, selectedCat, fetchProducts]);

  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        const { data } = await api.get(`/products/barcode/${barcodeInput.trim()}`);
        if (data.success) {
          if (data.data.stok > 0) { addItem(data.data); toast.success(`${data.data.nama_produk} ditambahkan`); }
          else toast.error(`Stok ${data.data.nama_produk} habis!`);
        }
      } catch { toast.error('Produk tidak ditemukan'); }
      setBarcodeInput('');
    }
  };

  const handleAddItem = (product) => {
    if (product.stok <= 0) return toast.error('Stok produk habis!');
    const inCart = items.find(i => i.id === product.id);
    if (inCart && inCart.quantity >= product.stok) return toast.error(`Stok tersedia: ${product.stok}`);
    addItem(product);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[calc(100vh-7rem)]">

      {/* ---- KIRI: Produk ---- */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h1 className="font-display text-wood-800 text-2xl">Kasir</h1>

        {/* Barcode scanner */}
        <div className="card-classic p-3 flex items-center gap-3">
          <span className="text-xl">▦</span>
          <input className="input-classic flex-1 font-mono"
            placeholder="Scan barcode atau ketik & tekan Enter..."
            value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeSearch} />
        </div>

        {/* Search */}
        <input className="input-classic" placeholder="🔍 Cari produk..."
          value={search} onChange={e => setSearch(e.target.value)} />

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCat('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
            ${!selectedCat ? 'bg-wood-700 text-cream-100 border-wood-700' : 'bg-white text-wood-500 border-cream-200 hover:border-wood-400'}`}>
            Semua
          </button>
          {categories.map(c => (
            <button key={c.id}
              onClick={() => setSelectedCat(String(c.id) === selectedCat ? '' : String(c.id))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
              ${String(c.id) === selectedCat ? 'bg-wood-700 text-cream-100 border-wood-700' : 'bg-white text-wood-500 border-cream-200 hover:border-wood-400'}`}>
              {c.nama}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto flex-1">
          {loading ? [...Array(8)].map((_, i) => (
            <div key={i} className="card-classic p-3 space-y-2">
              <div className="skeleton h-24 w-full rounded-lg" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          )) : products.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-wood-400">Produk tidak ditemukan</p>
            </div>
          ) : products.map(p => {
            const inCart = items.find(i => i.id === p.id);
            const outOfStock = p.stok <= 0;
            return (
              <motion.button key={p.id}
                whileHover={{ scale: outOfStock ? 1 : 1.02 }}
                whileTap={{ scale: outOfStock ? 1 : 0.97 }}
                onClick={() => handleAddItem(p)} disabled={outOfStock}
                className={`card-classic p-3 text-left transition-all
                ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-wood-300'}
                ${inCart ? 'border-wood-400 bg-wood-50' : ''}`}
              >
                <div className="w-full h-24 rounded-lg bg-cream-100 overflow-hidden mb-2 flex items-center justify-center">
                  {p.gambar
                    ? <img src={getImageUrl(p.gambar)} alt={p.nama_produk} className="w-full h-full object-cover" />
                    : <span className="text-3xl">📦</span>
                  }
                </div>
                <p className="text-xs font-semibold text-wood-800 line-clamp-2 leading-tight mb-1">{p.nama_produk}</p>
                <p className="text-sm font-bold text-wood-600">{formatRupiah(p.harga_jual)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-wood-400">Stok: {p.stok}</p>
                  {inCart && (
                    <span className="bg-wood-700 text-cream-100 text-xs rounded-full px-1.5 py-0.5 font-bold">
                      ×{inCart.quantity}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ---- KANAN: Cart ---- */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-3">
        <div className="card-classic flex flex-col flex-1">
          <div className="bg-wood-800 px-4 py-3 rounded-t-xl flex items-center justify-between">
            <h2 className="font-display text-cream-100 text-lg">Keranjang</h2>
            <span className="bg-gold-500 text-wood-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length} item
            </span>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80 lg:max-h-none">
            <AnimatePresence>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-wood-400 text-sm">Keranjang kosong</p>
                  <p className="text-wood-300 text-xs mt-1">Klik produk untuk menambahkan</p>
                </div>
              ) : items.map(item => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 bg-cream-50 border border-cream-200 rounded-lg p-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-cream-100 overflow-hidden flex-shrink-0">
                    {item.gambar
                      ? <img src={getImageUrl(item.gambar)} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-wood-700 truncate">{item.nama_produk}</p>
                    <p className="text-xs text-wood-500">{formatRupiah(item.harga_jual)} × {item.quantity}</p>
                    <p className="text-xs font-bold text-wood-700">{formatRupiah(item.harga_jual * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-cream-200 hover:bg-cream-300 text-wood-700 font-bold text-sm flex items-center justify-center">−</button>
                    <span className="w-7 text-center text-sm font-bold text-wood-800">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-wood-700 hover:bg-wood-800 text-cream-100 font-bold text-sm flex items-center justify-center">+</button>
                    <button onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-full text-red-400 hover:bg-red-50 flex items-center justify-center ml-1">×</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Cart footer */}
          {items.length > 0 && (
            <div className="border-t border-cream-200 p-4 space-y-2">

              {/* Promo aktif banner di cart */}
              {promoAktif && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-semibold">
                  🎉 Diskon {ATURAN.DISKON_PERSEN}% + PPN {ATURAN.PPN_PERSEN}% aktif
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-wood-500">Subtotal</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              {diskon > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Diskon {ATURAN.DISKON_PERSEN}%</span>
                  <span>− {formatRupiah(diskon)}</span>
                </div>
              )}
              {pajakVal > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>PPN {ATURAN.PPN_PERSEN}%</span>
                  <span>+ {formatRupiah(pajakVal)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-cream-200">
                <span className="font-display text-wood-800 text-base">Total</span>
                <span className="font-display font-bold text-wood-800 text-xl">{formatRupiah(total)}</span>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                className="btn-gold w-full flex items-center justify-center gap-2 text-base py-3 mt-1"
              >
                💳 Bayar {formatRupiah(total)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={(trx) => { setShowCheckout(false); setSuccessTrx(trx); }}
      />
      <StrukSuccessModal trx={successTrx} onClose={() => setSuccessTrx(null)} />
    </div>
  );
};

export default KasirPage;
