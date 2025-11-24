import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

// Helper warna status
const getStatusColor = (status) => {
  switch(status) {
    case 'hadir': return '#d4edda'; // Hijau
    case 'sakit': return '#fff3cd'; // Kuning
    case 'izin': return '#cce5ff';  // Biru
    case 'alfa': return '#f8d7da';  // Merah
    default: return '#fff';
  }
};

function SiswaDetail({ token }) {
  const { id } = useParams(); // Ambil ID dari URL
  const navigate = useNavigate();

  const [siswa, setSiswa] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ H: 0, S: 0, I: 0, A: 0 });

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Ambil Biodata Siswa
        const resSiswa = await axios.get(`https://absensi-fajar-harapan-production.up.railway.app/api/siswa/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSiswa(resSiswa.data);

        // 2. Ambil Riwayat Absensi
        const resRiwayat = await axios.get(`https://absensi-fajar-harapan-production.up.railway.app/api/absensi/siswa/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRiwayat(resRiwayat.data);

        // 3. Hitung Statistik Manual
        const hitung = { H: 0, S: 0, I: 0, A: 0 };
        resRiwayat.data.forEach(item => {
          if (item.status === 'hadir') hitung.H++;
          else if (item.status === 'sakit') hitung.S++;
          else if (item.status === 'izin') hitung.I++;
          else if (item.status === 'alfa') hitung.A++;
        });
        setStats(hitung);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  if (loading) return <div>Loading profil siswa...</div>;
  if (!siswa) return <div>Siswa tidak ditemukan.</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 15px', cursor: 'pointer' }}>
        ⬅ Kembali
      </button>

      {/* KARTU PROFIL */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Kiri: Biodata */}
        <div>
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>{siswa.nama}</h2>
          <p style={{ margin: '5px 0', color: '#666', fontSize: '16px' }}>NIS: <strong>{siswa.nis}</strong></p>
          <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>Kelas: <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{siswa.kelas}</span></p>
        </div>

        {/* Kanan: Statistik Ringkas */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <div style={{ textAlign: 'center', background: '#d1fae5', padding: '10px 20px', borderRadius: '10px', color: '#065f46' }}>
            <h3 style={{ margin: 0, fontSize: '24px' }}>{stats.H}</h3>
            <span style={{ fontSize: '12px' }}>Hadir</span>
          </div>
          <div style={{ textAlign: 'center', background: '#fef3c7', padding: '10px 20px', borderRadius: '10px', color: '#92400e' }}>
            <h3 style={{ margin: 0, fontSize: '24px' }}>{stats.S}</h3>
            <span style={{ fontSize: '12px' }}>Sakit</span>
          </div>
          <div style={{ textAlign: 'center', background: '#dbeafe', padding: '10px 20px', borderRadius: '10px', color: '#1e40af' }}>
            <h3 style={{ margin: 0, fontSize: '24px' }}>{stats.I}</h3>
            <span style={{ fontSize: '12px' }}>Izin</span>
          </div>
          <div style={{ textAlign: 'center', background: '#fee2e2', padding: '10px 20px', borderRadius: '10px', color: '#991b1b' }}>
            <h3 style={{ margin: 0, fontSize: '24px' }}>{stats.A}</h3>
            <span style={{ fontSize: '12px' }}>Alfa</span>
          </div>
        </div>
      </div>

      {/* TABEL RIWAYAT */}
      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Riwayat Kehadiran</h3>
      
      {riwayat.length === 0 ? (
        <p>Belum ada data absensi.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th>Tanggal</th>
              <th>Mata Pelajaran</th>
              <th>Status</th>
              <th>Bukti</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.tanggal).toLocaleDateString('id-ID', { dateStyle: 'full' })}</td>
                <td>
                  {item.mapel ? (
                    <>
                      <strong>{item.mapel}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: '#666' }}>{item.jam_mulai} - {item.nama_guru}</span>
                    </>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#aaa' }}>Absensi Manual</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ 
                    background: getStatusColor(item.status), 
                    padding: '5px 15px', 
                    borderRadius: '20px', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '12px'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item.bukti_foto ? (
                    <a 
                      href={`https://absensi-fajar-harapan-production.up.railway.app/uploads/${item.bukti_foto}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '13px' }}
                    >
                      Lihat Foto
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SiswaDetail;