// Format currency
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const defaultOpts = {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', ...options
  };
  return date.toLocaleDateString('id-ID', defaultOpts);
};

// Format date short
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Get stock status
export const getStockStatus = (stok, stok_minimum) => {
  if (stok === 0) return { label: 'Habis', class: 'badge-danger', color: 'red' };
  if (stok <= stok_minimum) return { label: 'Hampir Habis', class: 'badge-warning', color: 'amber' };
  return { label: 'Aman', class: 'badge-success', color: 'green' };
};

// Get payment method label
export const getMetodeLabel = (metode) => {
  const map = {
    tunai: 'Tunai', transfer: 'Transfer Bank',
    debit: 'Debit', kredit: 'Kredit', ewallet: 'E-Wallet'
  };
  return map[metode] || metode;
};

// Save offline transaction
export const saveOfflineTransaction = (trx) => {
  try {
    const offline = JSON.parse(localStorage.getItem('pos_offline_trx') || '[]');
    offline.push({ ...trx, offline_id: Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem('pos_offline_trx', JSON.stringify(offline));
  } catch { /* ignore */ }
};

// Get offline transactions
export const getOfflineTransactions = () => {
  try {
    return JSON.parse(localStorage.getItem('pos_offline_trx') || '[]');
  } catch { return []; }
};

// Image URL helper
export const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `https://backend-kasirv2-59u6j3fn9-krysnaaaws-projects.vercel.app//uploads/${filename}`;
};

// Number input sanitize
export const toNumber = (val, fallback = 0) => {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
};
