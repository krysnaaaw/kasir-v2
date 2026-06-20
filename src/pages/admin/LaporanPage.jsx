import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../services/api';
import { formatRupiah, formatDateShort, getMetodeLabel } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#8b5e3c', '#e6a817', '#4a2c14', '#d4a843', '#6b4226', '#f4c842', '#2d1a08', '#edd99a'];

const LaporanPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports').then(res => {
      if (res.data.success) setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-classic p-5 h-64 flex items-center justify-center">
            <div className="skeleton w-full h-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!data) return <div className="text-center py-16 text-wood-400">Gagal memuat laporan.</div>;

  const { revenue_7_hari, pendapatan_bulanan, produk_terlaris, metode_pembayaran, inventori_per_kategori, margin_per_kategori, ringkasan } = data;

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { family: 'Lato', size: 11 }, color: '#4a2c14' } } },
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-wood-800 text-2xl lg:text-3xl">Laporan & Analitik</h1>
        <p className="text-wood-400 text-sm">Ringkasan performa bisnis Anda</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pendapatan', val: formatRupiah(ringkasan?.total_revenue || 0), icon: '💰' },
          { label: 'Total Transaksi', val: ringkasan?.total_transaksi || 0, icon: '🧾' },
          { label: 'Rata-rata Transaksi', val: formatRupiah(ringkasan?.avg_transaksi || 0), icon: '📊' },
          { label: 'Transaksi Tertinggi', val: formatRupiah(ringkasan?.max_transaksi || 0), icon: '🏆' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card-classic p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-wood-400 text-xs">{s.label}</p>
                <p className="font-display text-wood-700 text-lg font-bold">{s.val}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue 7 days */}
        <div className="card-classic p-5">
          <h3 className="font-display text-wood-700 text-lg mb-4">Pendapatan 7 Hari Terakhir</h3>
          <div className="h-52">
            <Line
              data={{
                labels: revenue_7_hari.map(d => formatDateShort(d.tanggal)),
                datasets: [{ label: 'Pendapatan', data: revenue_7_hari.map(d => d.revenue),
                  borderColor: '#8b5e3c', backgroundColor: 'rgba(139,94,60,0.15)', tension: 0.4, fill: true,
                  pointBackgroundColor: '#e6a817', pointRadius: 5 }]
              }}
              options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } },
                scales: { y: { ticks: { callback: v => 'Rp' + (v/1000).toFixed(0) + 'k', font: { size: 10 } } },
                  x: { ticks: { font: { size: 10 } } } } }}
            />
          </div>
        </div>

        {/* Monthly revenue */}
        <div className="card-classic p-5">
          <h3 className="font-display text-wood-700 text-lg mb-4">Pendapatan Bulanan</h3>
          <div className="h-52">
            <Bar
              data={{
                labels: pendapatan_bulanan.map(d => d.bulan),
                datasets: [{ label: 'Pendapatan', data: pendapatan_bulanan.map(d => d.revenue),
                  backgroundColor: COLORS.map(c => c + 'cc'), borderColor: COLORS, borderWidth: 1, borderRadius: 6 }]
              }}
              options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } },
                scales: { y: { ticks: { callback: v => 'Rp' + (v/1000).toFixed(0) + 'k', font: { size: 10 } } } } }}
            />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top products */}
        <div className="card-classic p-5 lg:col-span-2">
          <h3 className="font-display text-wood-700 text-lg mb-4">Produk Terlaris</h3>
          <div className="h-56">
            <Bar
              data={{
                labels: produk_terlaris.map(p => p.nama_produk.length > 20 ? p.nama_produk.slice(0, 18) + '..' : p.nama_produk),
                datasets: [{ label: 'Terjual', data: produk_terlaris.map(p => p.total_terjual),
                  backgroundColor: '#8b5e3c', borderRadius: 4 }]
              }}
              options={{ ...chartOpts, indexAxis: 'y', plugins: { ...chartOpts.plugins, legend: { display: false } },
                scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }}
            />
          </div>
        </div>

        {/* Payment methods */}
        <div className="card-classic p-5">
          <h3 className="font-display text-wood-700 text-lg mb-4">Metode Pembayaran</h3>
          <div className="h-56">
            <Doughnut
              data={{
                labels: metode_pembayaran.map(m => getMetodeLabel(m.metode_pembayaran)),
                datasets: [{ data: metode_pembayaran.map(m => m.count), backgroundColor: COLORS, borderWidth: 0 }]
              }}
              options={{ ...chartOpts, cutout: '65%',
                plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }}
            />
          </div>
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by category */}
        <div className="card-classic p-5">
          <h3 className="font-display text-wood-700 text-lg mb-4">Nilai Inventori per Kategori</h3>
          <div className="h-52">
            <Bar
              data={{
                labels: inventori_per_kategori.map(c => c.nama),
                datasets: [
                  { label: 'Nilai Jual', data: inventori_per_kategori.map(c => c.nilai_jual), backgroundColor: '#8b5e3ccc', borderRadius: 4 },
                  { label: 'Nilai Beli', data: inventori_per_kategori.map(c => c.nilai_beli), backgroundColor: '#e6a817cc', borderRadius: 4 },
                ]
              }}
              options={{ ...chartOpts, scales: { y: { ticks: { callback: v => 'Rp' + (v/1000).toFixed(0) + 'k', font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }}
            />
          </div>
        </div>

        {/* Margin by category */}
        <div className="card-classic p-5">
          <h3 className="font-display text-wood-700 text-lg mb-4">Estimasi Margin per Kategori</h3>
          <div className="h-52">
            <Bar
              data={{
                labels: margin_per_kategori.map(c => c.nama),
                datasets: [{ label: 'Margin (%)', data: margin_per_kategori.map(c => parseFloat(c.avg_margin || 0).toFixed(1)),
                  backgroundColor: margin_per_kategori.map(c => parseFloat(c.avg_margin) >= 20 ? '#22c55ecc' : parseFloat(c.avg_margin) >= 10 ? '#e6a817cc' : '#ef4444cc'),
                  borderRadius: 4 }]
              }}
              options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } },
                scales: { y: { ticks: { callback: v => v + '%', font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }}
            />
          </div>
          <div className="flex gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> &ge;20%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> &ge;10%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> &lt;10%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPage;
