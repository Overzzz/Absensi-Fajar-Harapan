import React, { useState } from 'react';
import axios from 'axios';

function GuruForm({ onGuruAdded, token }) {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [mapel, setMapel] = useState('');
  const [tglLahir, setTglLahir] = useState('');
  const [message, setMessage] = useState('');

  // --- DATA MAPEL (Samakan dengan JadwalManager) ---
  const daftarMapel = [
    "Matematika", "Fisika", "Kimia", "Biologi",
    "Bahasa Indonesia", "Bahasa Inggris", "Bahasa Arab",
    "Sejarah", "Geografi", "Ekonomi", "Sosiologi",
    "PKN", "Agama", "Penjaskes", "Seni Budaya",
    "TIK / Informatika", "BK (Konseling)", "Guru Kelas (SD)"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const dataGuruBaru = { nama, nip, mapel, tgl_lahir: tglLahir };

    try {
      const response = await axios.post('http://localhost:5000/api/guru', dataGuruBaru, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: response.data.message });
      
      // Reset form
      setNama(''); setNip(''); setMapel(''); setTglLahir('');
      
      if (onGuruAdded) onGuruAdded();

    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response ? `Error: ${err.response.data.message}` : "Gagal terhubung." 
      });
    }
  };

  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Tambah Guru Baru</h3>
      
      <div style={{ fontSize: '13px', color: '#555', background: '#eef2ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #4361ee', marginBottom: '20px' }}>
        ℹ️ <strong>Info Akun Otomatis:</strong><br/>
        Username = <strong>NIP</strong> <br/>
        Password = <strong>Tanggal Lahir</strong> (Format: DDMMYYYY, misal: 17081990)
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Nama Lengkap:</label>
          <input 
            type="text" 
            value={nama} 
            onChange={(e) => setNama(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} 
            placeholder="Contoh: Budi Santoso, S.Pd"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>NIP (Username):</label>
          <input 
            type="text" 
            value={nip} 
            onChange={(e) => setNip(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} 
            placeholder="Nomor Induk Pegawai"
          />
        </div>
        
        {/* [DIUBAH] Input Mapel jadi Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Mata Pelajaran:</label>
          <select 
            value={mapel} 
            onChange={(e) => setMapel(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: 'white' }}
          >
            <option value="">-- Pilih Mata Pelajaran --</option>
            {daftarMapel.map((mp, idx) => (
              <option key={idx} value={mp}>{mp}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Tgl Lahir (Password):</label>
          <input 
            type="date" 
            value={tglLahir} 
            onChange={(e) => setTglLahir(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} 
          />
        </div>

        <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' }}>
          + Simpan Guru & Buat Akun
        </button>
      </form>
      
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          borderRadius: '8px', 
          backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5', 
          color: message.type === 'error' ? '#b91c1c' : '#047857',
          fontWeight: '500',
          border: message.type === 'error' ? '1px solid #fecaca' : '1px solid #a7f3d0'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default GuruForm;