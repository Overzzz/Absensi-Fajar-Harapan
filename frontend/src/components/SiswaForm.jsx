import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SiswaForm({ onSiswaAdded, token }) {
  const [nama, setNama] = useState('');
  const [nis, setNis] = useState('');
  const [kelas, setKelas] = useState('');
  const [kelasList, setKelasList] = useState([]); // [BARU] State untuk daftar kelas
  const [message, setMessage] = useState(''); 

  // [BARU] Ambil daftar kelas saat komponen dimuat
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/kelas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKelasList(response.data);
      } catch (err) {
        console.error("Gagal mengambil data kelas");
      }
    };
    if (token) fetchKelas();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const dataSiswaBaru = {
      nama: nama,
      nis: nis,
      kelas: kelas
    };

    try {
      const response = await axios.post('http://localhost:5000/api/siswa', dataSiswaBaru, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(response.data.message);
      setNama('');
      setNis('');
      setKelas('');
      
      if (onSiswaAdded) {
        onSiswaAdded();
      }

    } catch (err) {
      if (err.response) {
        setMessage(`Error: ${err.response.data.message || err.message}`);
      } else {
        setMessage("Gagal terhubung ke server.");
      }
    }
  };

  return (
    <div>
      <h3>Tambah Siswa Baru</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nama: </label>
          <input 
            type="text" 
            value={nama} 
            onChange={(e) => setNama(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>NIS: </label>
          <input 
            type="text" 
            value={nis} 
            onChange={(e) => setNis(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Kelas: </label>
          {/* [DIUBAH] Sekarang pakai Select/Dropdown */}
          <select 
            value={kelas} 
            onChange={(e) => setKelas(e.target.value)} 
            required
            style={{ padding: '5px', width: '170px' }}
          >
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.nama_kelas}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>Simpan</button>
      </form>
      
      {message && (
        <p style={{ color: message.startsWith('Error:') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default SiswaForm;