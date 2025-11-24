import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function SiswaEdit({ token }) {
  const [nama, setNama] = useState('');
  const [nis, setNis] = useState('');
  const [kelas, setKelas] = useState('');
  const [kelasList, setKelasList] = useState([]); // [BARU]
  const [message, setMessage] = useState('');
  
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  useEffect(() => {
    // 1. Ambil data siswa yang mau diedit
    const fetchSiswaById = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/siswa/${id}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const siswa = response.data;
        setNama(siswa.nama);
        setNis(siswa.nis);
        setKelas(siswa.kelas);
      } catch (err) {
        console.error("Error fetching siswa data:", err);
        setMessage("Gagal mengambil data siswa.");
      }
    };

    // 2. [BARU] Ambil daftar kelas untuk dropdown
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
    
    if (token) {
      fetchKelas(); // Fetch kelas dulu
      fetchSiswaById();
    }
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const dataSiswaUpdate = {
      nama: nama,
      nis: nis,
      kelas: kelas
    };

    try {
      const response = await axios.put(`http://localhost:5000/api/siswa/${id}`, dataSiswaUpdate, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/'); 
      }, 1500);

    } catch (err) {
      if (err.response) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Gagal terhubung ke server.");
      }
    }
  };

  return (
    <div>
      <h2>Edit Siswa (ID: {id})</h2>
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
          {/* [DIUBAH] Dropdown Kelas */}
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
        <button type="submit">Update Data</button>
        <button type="button" onClick={() => navigate('/')}>Batal</button>
      </form>
      
      {message && <p>{message}</p>}
    </div>
  );
}

export default SiswaEdit;