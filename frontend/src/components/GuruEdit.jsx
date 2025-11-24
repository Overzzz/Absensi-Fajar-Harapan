import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

// Ambil token sebagai prop
function GuruEdit({ token }) {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [mapel, setMapel] = useState('');
  const [message, setMessage] = useState('');
  
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchGuruById = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/guru/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const guru = response.data;
        
        setNama(guru.nama);
        setNip(guru.nip);
        setMapel(guru.mapel);
        
      } catch (err) {
        console.error("Error fetching guru data:", err);
        setMessage("Gagal mengambil data guru.");
      }
    };

    if (token) {
      fetchGuruById();
    }
  }, [id, token]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const dataGuruUpdate = {
      nama: nama,
      nip: nip,
      mapel: mapel
    };

    try {
      const response = await axios.put(`http://localhost:5000/api/guru/${id}`, dataGuruUpdate, {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(response.data.message);
      
      setTimeout(() => {
        navigate('/guru'); // Redirect ke halaman daftar guru
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
      <h2>Edit Guru (ID: {id})</h2>
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
          <label>NIP: </label>
          <input 
            type="text" 
            value={nip} 
            onChange={(e) => setNip(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Mata Pelajaran: </label>
          <input 
            type="text" 
            value={mapel} 
            onChange={(e) => setMapel(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Update Data</button>
        <button type="button" onClick={() => navigate('/guru')}>Batal</button>
      </form>
      
      {message && <p>{message}</p>}
    </div>
  );
}

export default GuruEdit;