import React, { useState, useEffect } from 'react';
import axios from 'axios';

const getTodayMonth = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'H': return { backgroundColor: '#d4edda', color: '#155724' };
    case 'S': return { backgroundColor: '#fff3cd', color: '#856404' };
    case 'I': return { backgroundColor: '#cce5ff', color: '#004085' };
    case 'A': return { backgroundColor: '#f8d7da', color: '#721c24' };
    default: return {};
  }
};

function RekapBulanan({ token }) {
  const [bulanFilter, setBulanFilter] = useState(getTodayMonth());
  const [kelasFilter, setKelasFilter] = useState(''); 
  const [mapelFilter, setMapelFilter] = useState(''); 
  
  const [kelasList, setKelasList] = useState([]);     
  const [mapelList, setMapelList] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [daysInMonth, setDaysInMonth] = useState(0);

  // Ambil Data Kelas & Mapel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resKelas = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/kelas', {headers: {Authorization: `Bearer ${token}`}});
        setKelasList(resKelas.data);

        const resJadwal = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/jadwal', {headers: {Authorization: `Bearer ${token}`}});
        const uniqueMapels = [...new Set(resJadwal.data.map(item => item.mapel))];
        setMapelList(uniqueMapels.sort());
      } catch (e) {}
    };
    if(token) fetchData();
  }, [token]);

  const fetchRekapBulanan = async () => {
    if (!token || !bulanFilter) return;
    setLoading(true);
    setError(null);
    setProcessedData(null); 

    try {
      // [BARU] Ambil guruId untuk filter otomatis
      const guruId = localStorage.getItem('guruId');

      const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/absensi', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
            bulan: bulanFilter,
            kelas: kelasFilter,
            mapel: mapelFilter,
            guru_id: guruId // [PENTING] Kirim ID guru
        } 
      });
      
      const rawData = response.data;
      if (rawData.length === 0) {
        setError('Tidak ada data absensi.');
        setLoading(false);
        return;
      }

      const [year, month] = bulanFilter.split('-').map(Number);
      const numDays = new Date(year, month, 0).getDate(); 
      setDaysInMonth(numDays);

      const processed = {}; 
      const siswaMap = new Map();
      
      rawData.forEach(item => {
        if (!siswaMap.has(item.siswa_id)) {
          siswaMap.set(item.siswa_id, {
            id: item.siswa_id,
            nama: item.nama_siswa,
            kelas: item.kelas
          });
        }
      });

      siswaMap.forEach(siswa => {
        processed[siswa.id] = {
          nama: siswa.nama,
          kelas: siswa.kelas,
          days: {},
          totals: { H: 0, S: 0, I: 0, A: 0 }
        };
        for (let day = 1; day <= numDays; day++) {
          processed[siswa.id].days[day] = '-'; 
        }
      });

      rawData.forEach(item => {
        const day = new Date(item.tanggal).getUTCDate(); 
        const status = item.status.charAt(0).toUpperCase(); 
        if (processed[item.siswa_id]) {
          processed[item.siswa_id].days[day] = status;
        }
      });

      Object.values(processed).forEach(siswaData => {
        for (let day = 1; day <= numDays; day++) {
          const status = siswaData.days[day];
          if (status === 'H') siswaData.totals.H++;
          else if (status === 'S') siswaData.totals.S++;
          else if (status === 'I') siswaData.totals.I++;
          else if (status === 'A') siswaData.totals.A++;
        }
      });
      
      setProcessedData(processed);

    } catch (err) {
      setError("Gagal mengambil data rekap.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchRekapBulanan(); }, [token]);
  const handleFilterSubmit = (e) => { e.preventDefault(); fetchRekapBulanan(); };
  
  // [UPDATE] Cetak Manual (Tanpa Library)
  const handlePrintManual = () => { window.print(); };

  const renderTableHeaders = () => {
    const headers = [];
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(<th key={day} style={{ minWidth: '20px', fontSize: '10px', padding: '2px' }}>{day}</th>);
    }
    return headers;
  };

  return (
    <div>
      <h2 className="no-print">Rekap Absensi Bulanan</h2>
      
      <form onSubmit={handleFilterSubmit} className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <label style={{ fontWeight: 'bold' }}>Bulan: </label>
        <input 
          type="month" 
          value={bulanFilter}
          onChange={(e) => setBulanFilter(e.target.value)}
          required
          style={{ padding: '5px' }}
        />

        <label style={{ marginLeft: '15px', fontWeight: 'bold' }}>Kelas: </label>
        <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} style={{ padding: '6px' }}>
            <option value="">-- Semua Kelas --</option>
            {kelasList.map(k => (<option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>))}
        </select>

        <label style={{ marginLeft: '15px', fontWeight: 'bold' }}>Mapel: </label>
        <select value={mapelFilter} onChange={(e) => setMapelFilter(e.target.value)} style={{ padding: '6px', minWidth: '150px' }}>
            <option value="">-- Semua Mapel --</option>
            {mapelList.map((m, idx) => (<option key={idx} value={m}>{m}</option>))}
        </select>

        <button type="submit" style={{ marginLeft: '15px', padding: '6px 15px', background: '#4361ee', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔍 Cari
        </button>

        {!loading && !error && processedData && (
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
      
      {loading && <div style={{ textAlign: 'center', color: '#666' }}>Memproses data...</div>}
      {error && !loading && <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
      
      {!loading && !error && processedData && (
        <div className="area-cetak"> 
          <h3 style={{ textAlign: 'center', marginBottom: '5px' }}>Laporan Absensi Bulanan</h3>
          <p style={{ textAlign: 'center', marginTop: '0', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
            Periode: {bulanFilter}
          </p>
          <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
            {kelasFilter ? `Kelas: ${kelasFilter}` : 'Semua Kelas'} 
            {mapelFilter ? ` | Mapel: ${mapelFilter}` : ' | Semua Mapel'}
          </div>

          <div style={{ overflowX: 'auto' }}> 
            <table border="1" cellPadding="2" cellSpacing="0" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th rowSpan="2" style={{ width: '30px' }}>No</th>
                  <th rowSpan="2">Nama Siswa</th>
                  <th rowSpan="2" style={{ width: '80px' }}>Kelas</th>
                  <th colSpan={daysInMonth} style={{ textAlign: 'center' }}>Tanggal</th>
                  <th colSpan="4" style={{ textAlign: 'center' }}>Total</th>
                </tr>
                <tr style={{ background: '#f1f5f9' }}>
                  {renderTableHeaders()}
                  <th style={{ backgroundColor: '#d4edda', minWidth: '25px' }}>H</th>
                  <th style={{ backgroundColor: '#fff3cd', minWidth: '25px' }}>S</th>
                  <th style={{ backgroundColor: '#cce5ff', minWidth: '25px' }}>I</th>
                  <th style={{ backgroundColor: '#f8d7da', minWidth: '25px' }}>A</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(processedData).map((siswaId, index) => {
                  const siswa = processedData[siswaId];
                  return (
                    <tr key={siswaId}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>{siswa.nama}</td>
                      <td style={{ textAlign: 'center' }}>{siswa.kelas}</td>
                      {Object.keys(siswa.days).map(day => (
                        <td key={day} style={{ textAlign: 'center', padding: '0', ...getStatusStyle(siswa.days[day]) }}>
                          {siswa.days[day] !== '-' ? siswa.days[day] : ''}
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{siswa.totals.H}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{siswa.totals.S}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{siswa.totals.I}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{siswa.totals.A}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default RekapBulanan;