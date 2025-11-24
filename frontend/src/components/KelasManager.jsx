import React, { useState, useEffect } from 'react';
import axios from 'axios';

function KelasManager({ token }) {
  const [kelasList, setKelasList] = useState([]);
  const [namaKelas, setNamaKelas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Ambil data kelas
  const fetchKelas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/kelas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKelasList(response.data);
    } catch (err) {
      console.error("Error fetching kelas:", err);
      setError("Gagal mengambil data kelas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchKelas();
  }, [token]);

  // Tambah kelas baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post('https://absensi-fajar-harapan-production.up.railway.app/api/kelas', 
        { nama_kelas: namaKelas }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Kelas berhasil ditambahkan!');
      setNamaKelas('');
      fetchKelas(); // Refresh daftar
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menambah kelas.");
    }
  };

  // Hapus kelas
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus kelas ini?")) return;

    try {
      await axios.delete(`https://absensi-fajar-harapan-production.up.railway.app/api/kelas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKelas();
    } catch (err) {
      alert("Gagal menghapus kelas.");
    }
  };

  return (
    <div>
      <h2>Manajemen Data Kelas</h2>

      {/* Form Tambah Kelas */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Nama Kelas (cth: X IPA 1)" 
          value={namaKelas}
          onChange={(e) => setNamaKelas(e.target.value)}
          required
          style={{ padding: '8px', width: '200px' }}
        />
        <button type="submit" style={{ marginLeft: '10px', padding: '8px 15px' }}>+ Tambah</button>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {/* Tabel Daftar Kelas */}
      <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '50%', minWidth: '300px' }}>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Kelas</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {kelasList.map((k, index) => (
            <tr key={k.id}>
              <td style={{ textAlign: 'center' }}>{index + 1}</td>
              <td>{k.nama_kelas}</td>
              <td style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => handleDelete(k.id)}
                  style={{ backgroundColor: 'tomato', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default KelasManager;