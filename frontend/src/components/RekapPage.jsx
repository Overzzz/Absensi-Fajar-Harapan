import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Fungsi untuk mendapatkan tanggal hari ini
const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function RekapPage({ token }) {
  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [tanggalFilter, setTanggalFilter] = useState(getTodayDate());
  const [kelasFilter, setKelasFilter] = useState(''); 
  const [kelasList, setKelasList] = useState([]);    

  // Ambil daftar kelas untuk dropdown
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const res = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/kelas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKelasList(res.data);
      } catch (e) { console.error("Gagal ambil kelas"); }
    };
    if(token) fetchKelas();
  }, [token]);

  // Fungsi Ambil Data Rekap
  const fetchRekap = async () => {
    if (!token || !tanggalFilter) return;
    setLoading(true);
    setError(null);
    
    try {
      // [BARU] Ambil guruId dari localStorage untuk filter otomatis
      const guruId = localStorage.getItem('guruId');

      const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/absensi', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
            tanggal: tanggalFilter,
            kelas: kelasFilter,
            guru_id: guruId // Kirim ID guru (null jika admin)
        } 
      });
      setRekapData(response.data);
      if (response.data.length === 0) {
        setError('Tidak ada data absensi untuk kriteria ini.');
      }
    } catch (err) {
      setError("Gagal mengambil data rekap.");
    } finally {
      setLoading(false);
    }
  };

  // Ambil data saat pertama kali load atau saat filter tanggal berubah
  useEffect(() => {
    fetchRekap();
  }, [token]); 

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchRekap();
  };

  // Fungsi Cetak Manual (Tanpa Library)
  const handlePrintManual = () => {
    window.print();
  };

  // Logic Pengelompokan Data per Mapel
  const groupedData = rekapData.reduce((acc, item) => {
    // Kunci grup: Nama Mapel + Jam + Guru
    const key = item.mapel 
      ? `${item.mapel} (${item.jam_mulai.slice(0,5)} - ${item.jam_selesai.slice(0,5)}) - Guru: ${item.nama_guru}` 
      : "Absensi Manual / Tanpa Jadwal";
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div>
      {/* Class 'no-print' menyembunyikan elemen saat dicetak */}
      <h2 className="no-print">Rekap Absensi Harian</h2>
      
      <form onSubmit={handleFilterSubmit} className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <label style={{ fontWeight: 'bold' }}>Tanggal: </label>
        <input 
          type="date" 
          value={tanggalFilter}
          onChange={(e) => setTanggalFilter(e.target.value)}
          required
          style={{ padding: '5px', marginRight: '15px' }}
        />

        <label style={{ fontWeight: 'bold' }}>Kelas: </label>
        <select 
            value={kelasFilter} 
            onChange={(e) => setKelasFilter(e.target.value)}
            style={{ padding: '5px', minWidth: '150px' }}
        >
            <option value="">-- Semua Kelas --</option>
            {kelasList.map(k => (
                <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>
            ))}
        </select>

        <button type="submit" style={{ marginLeft: '15px', padding: '6px 15px', background: '#4361ee', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔍 Cari Data
        </button>
        
        {!loading && !error && rekapData.length > 0 && (
          <button 
            type="button" 
            onClick={handlePrintManual}
            style={{ marginLeft: '10px', backgroundColor: '#28a745', color: 'white', padding: '6px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            🖨️ Cetak PDF
          </button>
        )}
      </form>
      
      <hr className="no-print" style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
      
      {loading && <div style={{ textAlign: 'center', color: '#666' }}>Sedang memuat data...</div>}
      {error && !loading && <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
      
      {/* Area ini yang akan muncul saat dicetak */}
      {!loading && !error && rekapData.length > 0 && (
        <div className="area-cetak">
          <h3 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '5px' }}>Laporan Absensi Harian</h3>
          <p style={{ textAlign: 'center', marginTop: '0', marginBottom: '20px', color: '#555', fontSize: '14px' }}>
            Tanggal: {new Date(tanggalFilter).toLocaleDateString('id-ID', { dateStyle: 'full' })}
            {kelasFilter && ` | Kelas: ${kelasFilter}`}
          </p>
          
          {/* Render Tabel Per Mata Pelajaran */}
          {Object.keys(groupedData).map((pelajaranKey, idx) => (
            <div key={idx} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
              
              {/* Header Mapel */}
              <div style={{ 
                background: '#f8fafc', 
                padding: '10px 15px', 
                border: '1px solid #000', 
                borderBottom: 'none', 
                fontWeight: 'bold', 
                fontSize: '14px',
                color: '#333'
              }}>
                📘 {pelajaranKey}
              </div>

              <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ width: '5%' }}>No.</th>
                    <th>Nama Siswa</th>
                    <th style={{ width: '15%' }}>Kelas</th>
                    <th style={{ width: '15%' }}>Status</th>
                    <th style={{ width: '20%' }}>Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData[pelajaranKey].map((absen, index) => (
                    <tr key={absen.id}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>{absen.nama_siswa}</td>
                      <td style={{ textAlign: 'center' }}>{absen.kelas}</td>
                      <td style={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: absen.status === 'hadir' ? '#15803d' : (absen.status === 'alfa' ? '#b91c1c' : '#b45309') 
                      }}>
                        {absen.status.toUpperCase()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {absen.bukti_foto ? (
                          <a 
                            href={`https://absensi-fajar-harapan-production.up.railway.app/uploads/${absen.bukti_foto}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '500' }}
                          >
                            Lihat Bukti
                          </a>
                        ) : (
                          <span style={{ color: '#ccc' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RekapPage;