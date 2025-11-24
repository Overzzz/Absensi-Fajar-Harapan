import React, { useState, useEffect } from 'react';
import axios from 'axios';

const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function AbsenPage({ token }) {
  const [listJadwalAktif, setListJadwalAktif] = useState([]); 
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null); 
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [absensi, setAbsensi] = useState({});
  const [tanggal] = useState(getTodayDate());
  const [files, setFiles] = useState({});

  useEffect(() => {
    const cekJadwal = async () => {
      try {
        setLoading(true);
        // [BARU] Ambil guruId dari localStorage (kalau admin null)
        const guruId = localStorage.getItem('guruId'); 
        
        const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/jadwal/aktif', {
          headers: { Authorization: `Bearer ${token}` },
          params: { guru_id: guruId } // [BARU] Kirim filter
        });

        if (response.data.length > 0) {
          setListJadwalAktif(response.data);
          if (response.data.length === 1) {
            setJadwalTerpilih(response.data[0]);
          }
        } else {
          setListJadwalAktif([]);
          setError("Tidak ada jadwal pelajaran ANDA yang sedang berlangsung saat ini.");
        }
      } catch (err) {
        setError("Gagal mengecek jadwal.");
      } finally {
        setLoading(false);
      }
    };

    if(token) cekJadwal();
  }, [token]);

  useEffect(() => {
    if (!jadwalTerpilih) return; 

    const fetchSiswa = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/siswa', {
          headers: { Authorization: `Bearer ${token}` },
          params: { kelas: jadwalTerpilih.nama_kelas } 
        });
        
        setSiswaList(response.data);
        
        const defaultAbsensi = {};
        response.data.forEach(siswa => { defaultAbsensi[siswa.id] = 'hadir'; });
        setAbsensi(defaultAbsensi);
        setFiles({});
      } catch (err) {
        alert("Gagal mengambil data siswa.");
      } finally {
        setLoading(false);
      }
    };

    fetchSiswa();
  }, [jadwalTerpilih, token]);

  const handleStatusChange = (siswaId, status) => {
    setAbsensi(prev => ({ ...prev, [siswaId]: status }));
  };

  const handleFileChange = (siswaId, e) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [siswaId]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const formData = new FormData();
    formData.append('tanggal', tanggal);
    formData.append('jadwal_id', jadwalTerpilih.id);

    const dataAbsen = siswaList.map(siswa => ({
      siswa_id: siswa.id,
      status: absensi[siswa.id]
    }));
    formData.append('dataAbsen', JSON.stringify(dataAbsen));

    Object.keys(files).forEach(siswaId => {
      if (files[siswaId]) {
        formData.append(`bukti_${siswaId}`, files[siswaId]);
      }
    });

    try {
      const response = await axios.post('https://absensi-fajar-harapan-production.up.railway.app/api/absensi', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(response.data.message);
    } catch (err) {
      if (err.response) setMessage(`Error: ${err.response.data.message}`);
      else setMessage("Gagal terhubung ke server.");
    }
  };

  return (
    <div>
      <h2>📝 Absensi Pelajaran</h2>

      {loading && listJadwalAktif.length === 0 && <p>Sedang memuat jadwal...</p>}

      {!loading && listJadwalAktif.length === 0 && error && (
        <div style={{ padding: '20px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', border: '1px solid #ffeeba' }}>
          <strong>Info:</strong> {error}
          <p>Pastikan jadwal sudah diatur oleh Admin.</p>
        </div>
      )}

      {!loading && listJadwalAktif.length > 1 && !jadwalTerpilih && (
        <div>
          <p>Ada <strong>{listJadwalAktif.length}</strong> kelas yang sedang berlangsung. Silakan pilih kelas:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {listJadwalAktif.map(jadwal => (
              <div 
                key={jadwal.id} 
                onClick={() => setJadwalTerpilih(jadwal)}
                style={{ 
                  background: 'white', padding: '20px', borderRadius: '10px', 
                  borderLeft: '5px solid #4361ee', cursor: 'pointer', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: '0.2s'
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{jadwal.nama_kelas}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <p style={{ margin: '5px 0' }}>📚 <strong>{jadwal.mapel}</strong></p>
                  <p style={{ margin: '5px 0' }}>⏰ {jadwal.jam_mulai} - {jadwal.jam_selesai}</p>
                </div>
                <button style={{ marginTop: '10px', width: '100%', background: '#4361ee', color: 'white', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer' }}>
                  Absen Kelas Ini
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && jadwalTerpilih && siswaList.length > 0 && (
        <div>
          {listJadwalAktif.length > 1 && (
            <button 
              onClick={() => { setJadwalTerpilih(null); setMessage(''); }} 
              style={{ marginBottom: '15px', background: '#6c757d', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '5px' }}
            >
              ⬅ Kembali Pilih Kelas
            </button>
          )}

          <div style={{ background: 'linear-gradient(135deg, #4361ee, #3a0ca3)', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{jadwalTerpilih.mapel}</h3>
            <p style={{ margin: '5px 0 0', fontSize: '1rem', opacity: 0.9 }}>
              Kelas: <strong>{jadwalTerpilih.nama_kelas}</strong> | Guru: {jadwalTerpilih.nama_guru}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              Jam: {jadwalTerpilih.jam_mulai} - {jadwalTerpilih.jam_selesai}
            </p>
          </div>

          {message && <p style={{ padding: '10px', borderRadius: '5px', backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda', color: message.includes('Error') ? '#721c24' : '#155724' }}>{message}</p>}

          <form onSubmit={handleSubmit}>
            <table border="1" cellPadding="10" style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, index) => (
                  <tr key={siswa.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>{siswa.nama}</td>
                    <td>
                      <div style={{ marginBottom: '5px' }}>
                        {['hadir', 'sakit', 'izin', 'alfa'].map(status => (
                          <label key={status} style={{ marginRight: '15px', cursor: 'pointer', fontWeight: absensi[siswa.id] === status ? 'bold' : 'normal', color: absensi[siswa.id] === status ? '#4361ee' : 'inherit' }}>
                            <input 
                              type="radio"
                              name={`status_${siswa.id}`}
                              value={status}
                              checked={absensi[siswa.id] === status} 
                              onChange={() => handleStatusChange(siswa.id, status)}
                              style={{ marginRight: '5px' }}
                            />
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </label>
                        ))}
                      </div>
                      {(absensi[siswa.id] === 'sakit' || absensi[siswa.id] === 'izin') && (
                        <div style={{ marginTop: '5px', padding: '5px', backgroundColor: '#fff3cd', borderRadius: '5px', fontSize: '12px' }}>
                          <label>📸 Upload Bukti (Surat): </label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(siswa.id, e)}
                            style={{ marginLeft: '10px' }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="submit" style={{ marginTop: '20px', padding: '12px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', float: 'right' }}>
              ✅ Simpan Absensi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AbsenPage;