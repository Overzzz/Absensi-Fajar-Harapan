import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import komponen Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Registrasi elemen Chart.js (Wajib)
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard({ token }) {
  const [stats, setStats] = useState({ 
    totalSiswa: 0, totalGuru: 0, totalKelas: 0,
    totalHadir: 0, totalSakit: 0, totalIzin: 0, totalAlfa: 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (err) {
        console.error("Gagal mengambil data dashboard");
      }
    };

    if (token) fetchStats();
  }, [token]);

  // --- DATA UNTUK GRAFIK ---
  const dataPie = {
    labels: ['Hadir', 'Sakit', 'Izin', 'Alfa'],
    datasets: [
      {
        label: 'Jumlah',
        data: [stats.totalHadir, stats.totalSakit, stats.totalIzin, stats.totalAlfa],
        backgroundColor: [
          '#10b981', // Hijau (Hadir)
          '#f59e0b', // Kuning (Sakit)
          '#3b82f6', // Biru (Izin)
          '#ef476f', // Merah (Alfa)
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
          '#ffffff',
          '#ffffff',
        ],
        borderWidth: 2,
      },
    ],
  };

  const dataBar = {
    labels: ['Data Master'],
    datasets: [
      {
        label: 'Siswa',
        data: [stats.totalSiswa],
        backgroundColor: '#4361ee',
      },
      {
        label: 'Guru',
        data: [stats.totalGuru],
        backgroundColor: '#7209b7',
      },
      {
        label: 'Kelas',
        data: [stats.totalKelas],
        backgroundColor: '#f72585',
      },
    ],
  };

  return (
    <div>
      <h2 className="dashboard-title">Dashboard Ringkasan</h2>
      
      {/* KARTU STATISTIK */}
      <div className="stats-grid">
        <div className="stat-card card-blue">
          <h3>{stats.totalSiswa}</h3>
          <p>Total Siswa</p>
        </div>
        <div className="stat-card card-green">
          <h3>{stats.totalGuru}</h3>
          <p>Total Guru</p>
        </div>
        <div className="stat-card card-orange">
          <h3>{stats.totalKelas}</h3>
          <p>Total Kelas</p>
        </div>
      </div>

      {/* AREA GRAFIK */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* GRAFIK 1: PIE CHART (Absensi) */}
        <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ textAlign: 'center', fontSize: '18px', color: '#333', marginBottom: '20px' }}>Statistik Kehadiran</h3>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            {/* Tampilkan pesan jika belum ada data absensi */}
            {(stats.totalHadir + stats.totalSakit + stats.totalIzin + stats.totalAlfa) > 0 ? (
              <Pie data={dataPie} />
            ) : (
              <p style={{ marginTop: '50px', color: '#aaa' }}>Belum ada data absensi masuk.</p>
            )}
          </div>
        </div>

        {/* GRAFIK 2: BAR CHART (Data Master) */}
        <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ textAlign: 'center', fontSize: '18px', color: '#333', marginBottom: '20px' }}>Komposisi Data Sekolah</h3>
          <div style={{ height: '300px' }}>
            <Bar 
              data={dataBar} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } } 
              }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;