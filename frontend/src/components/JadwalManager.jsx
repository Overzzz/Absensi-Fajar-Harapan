import React, { useState, useEffect } from 'react';
import axios from 'axios';

function JadwalManager({ token }) {
  const [jadwalList, setJadwalList] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [kelas, setKelas] = useState([]);
  
  const [formData, setFormData] = useState({
    hari: 'Senin',
    jam_mulai: '',
    jam_selesai: '',
    mapel: '',
    guru_id: '',
    kelas_id: ''
  });

  const [message, setMessage] = useState('');

  // --- DATA STATIS (OPSI PILIHAN) ---
  
  // 1. Daftar Mata Pelajaran (Bisa ditambah sesuai kebutuhan sekolah)
  const daftarMapel = [
    "Matematika", "Fisika", "Kimia", "Biologi",
    "Bahasa Indonesia", "Bahasa Inggris", "Bahasa Arab",
    "Sejarah", "Geografi", "Ekonomi", "Sosiologi",
    "PKN", "Agama", "Penjaskes", "Seni Budaya",
    "TIK / Informatika", "BK (Konseling)"
  ];

  // 2. Generate Daftar Jam (Interval 15 menit dari 07:00 - 17:00)
  const generateTimeOptions = () => {
    const times = [];
    for (let i = 7; i <= 17; i++) {
      const hour = i < 10 ? `0${i}` : i;
      times.push(`${hour}:00`);
      times.push(`${hour}:15`);
      times.push(`${hour}:30`);
      times.push(`${hour}:45`);
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  // --- END DATA STATIS ---

  useEffect(() => {
    if(token) {
      refreshData();
      axios.get('http://localhost:5000/api/guru', { headers: { Authorization: `Bearer ${token}` }})
        .then(res => setGurus(res.data));
      axios.get('http://localhost:5000/api/kelas', { headers: { Authorization: `Bearer ${token}` }})
        .then(res => setKelas(res.data));
    }
  }, [token]);

  const refreshData = () => {
    axios.get('http://localhost:5000/api/jadwal', { headers: { Authorization: `Bearer ${token}` }})
      .then(res => setJadwalList(res.data))
      .catch(err => console.error(err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/jadwal', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Jadwal berhasil ditambahkan!');
      refreshData();
    } catch (err) {
      setMessage('Gagal menambah jadwal.');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Hapus jadwal ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/jadwal/${id}`, { headers: { Authorization: `Bearer ${token}` }});
        refreshData();
      } catch (err) { alert('Gagal hapus'); }
    }
  };

  return (
    <div>
      <h2>Manajemen Jadwal Pelajaran</h2>
      
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <div>
            <label>Hari:</label>
            <select style={{ width: '100%', padding: '8px' }} value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})}>
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* [DIUBAH] Mapel sekarang Dropdown */}
          <div>
            <label>Mata Pelajaran:</label>
            <select 
              style={{ width: '100%', padding: '8px' }} 
              required 
              value={formData.mapel} 
              onChange={e => setFormData({...formData, mapel: e.target.value})}
            >
              <option value="">- Pilih Mata Pelajaran -</option>
              {daftarMapel.map((mp, idx) => (
                <option key={idx} value={mp}>{mp}</option>
              ))}
            </select>
          </div>

          {/* [DIUBAH] Jam Mulai sekarang Dropdown */}
          <div>
            <label>Jam Mulai:</label>
            <select 
              style={{ width: '100%', padding: '8px' }} 
              required 
              value={formData.jam_mulai} 
              onChange={e => setFormData({...formData, jam_mulai: e.target.value})}
            >
              <option value="">- Pilih Jam Mulai -</option>
              {timeOptions.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* [DIUBAH] Jam Selesai sekarang Dropdown */}
          <div>
            <label>Jam Selesai:</label>
            <select 
              style={{ width: '100%', padding: '8px' }} 
              required 
              value={formData.jam_selesai} 
              onChange={e => setFormData({...formData, jam_selesai: e.target.value})}
            >
              <option value="">- Pilih Jam Selesai -</option>
              {timeOptions.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Kelas:</label>
            <select style={{ width: '100%', padding: '8px' }} required value={formData.kelas_id} onChange={e => setFormData({...formData, kelas_id: e.target.value})}>
              <option value="">- Pilih Kelas -</option>
              {kelas.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>

          <div>
            <label>Guru Pengajar:</label>
            <select style={{ width: '100%', padding: '8px' }} required value={formData.guru_id} onChange={e => setFormData({...formData, guru_id: e.target.value})}>
              <option value="">- Pilih Guru -</option>
              {gurus.map(g => <option key={g.id} value={g.id}>{g.nama} - {g.mapel}</option>)}
            </select>
          </div>

        </div>
        <button type="submit" style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>+ Simpan Jadwal</button>
      </form>

      <table border="1" cellPadding="10" style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th>Hari</th>
            <th>Jam</th>
            <th>Kelas</th>
            <th>Mapel</th>
            <th>Guru</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {jadwalList.map(j => (
            <tr key={j.id}>
              <td>{j.hari}</td>
              <td>{j.jam_mulai.slice(0,5)} - {j.jam_selesai.slice(0,5)}</td>
              <td>{j.nama_kelas}</td>
              <td>{j.mapel}</td>
              <td>{j.nama_guru}</td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => handleDelete(j.id)} style={{ background: 'tomato', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px' }}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default JadwalManager;