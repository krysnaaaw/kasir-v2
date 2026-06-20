import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../services/api';
import { formatRupiah, formatDateShort } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ icon, label, value, sub, color = 'wood' }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="card-classic p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-wood-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <p className={`font-display text-2xl font-bold text-${color}-700`}>{value}</p>
        {sub && <p className="text-wood-400 text-xs mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center text-2xl`}>{icon}</div>
    </div>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="card-classic p-5 space-y-3">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-32 rounded" />
    <div className="skeleton h-3 w-20 rounded" />
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data.success) setData(res.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const weeklyLabels = data?.pendapatan_mingguan?.map(d => formatDateShort(d.tanggal)) || [];
  const weeklyValues = data?.pendapatan_mingguan?.map(d => d.revenue) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Dashboard</h1>
        <p className="text-wood-400 text-sm mt-1">Selamat datang kembali, <span className="font-semibold text-wood-600">{user?.nama}</span></p>
      </motion.div>

      {/* Revenue stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Pendapatan Hari Ini" value={formatRupiah(data?.pendapatan?.hari_ini || 0)} sub={`${data?.pendapatan?.transaksi_hari_ini || 0} transaksi`} color="gold" />
        <StatCard icon="📅" label="Minggu Ini" value={formatRupiah(data?.pendapatan?.minggu_ini || 0)} color="wood" />
        <StatCard icon="📆" label="Bulan Ini" value={formatRupiah(data?.pendapatan?.bulan_ini || 0)} color="wood" />
        <StatCard icon="🧾" label="Total Transaksi" value={data?.pendapatan?.total_transaksi || 0} sub="Semua waktu" color="wood" />
      </div>

      {/* Product stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📦" label="Total Produk" value={data?.produk?.total_produk || 0} color="wood" />
        <StatCard icon="🏷️" label="Kategori" value={data?.produk?.total_kategori || 0} color="wood" />
        <StatCard icon="⚠️" label="Hampir Habis" value={data?.produk?.stok_hampir || 0} color="amber" />
        <StatCard icon="❌" label="Stok Habis" value={data?.produk?.stok_habis || 0} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="card-classic p-5 lg:col-span-2">
          <h3 className="font-display text-wood-700 text-lg mb-4">Pendapatan 7 Hari</h3>
          <Line
            data={{
              labels: weeklyLabels,
              datasets: [{
                label: 'Pendapatan',
                data: weeklyValues,
                borderColor: '#8b5e3c',
                backgroundColor: 'rgba(139,94,60,0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#e6a817',
                pointRadius: 5,
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: v => 'Rp' + (v/1000).toFixed(0) + 'k', font: { size: 11 } } },
                x: { ticks: { font: { size: 11 } } }
              }
            }}
          />
        </div>

        {/* Top products */}
        <div className="card-classic p-5">
          <h3 className="font-display text-wood-700 text-lg mb-4">Produk Terlaris</h3>
          <div className="space-y-3">
            {data?.produk_terlaris?.length ? data.produk_terlaris.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-xs font-bold text-wood-800">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-wood-700 truncate">{p.nama_produk}</p>
                  <p className="text-xs text-wood-400">{p.total_terjual} terjual</p>
                </div>
                <p className="text-xs font-semibold text-wood-600">{formatRupiah(p.total_revenue)}</p>
              </div>
            )) : <p className="text-wood-400 text-sm text-center py-8">Belum ada data</p>}
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {data?.stok_rendah?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-classic p-5 border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <h3 className="font-display text-wood-700 text-lg">Peringatan Stok Rendah</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.stok_rendah.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2.5">
                <p className="text-sm font-semibold text-wood-700 truncate flex-1">{p.nama_produk}</p>
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${p.stok === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stok} {p.satuan}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
