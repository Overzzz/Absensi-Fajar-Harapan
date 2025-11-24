import React from 'react';
import { Link } from 'react-router-dom'; 

function GuruList({ guruList, loading, error, onDelete }) {
  
  if (loading) {
    return <div>Loading data guru...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleDeleteClick = (id) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <div>
      <h2>Daftar Guru</h2>
      
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>NIP</th>
            <th>Mata Pelajaran</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {guruList.length > 0 ? (
            guruList.map(guru => (
              <tr key={guru.id}>
                <td>{guru.id}</td>
                <td>{guru.nama}</td>
                <td>{guru.nip}</td>
                <td>{guru.mapel}</td>
                <td>
                  {/* PENTING: Ubah link ke /guru/edit/ */}
                  <Link to={`/guru/edit/${guru.id}`}>
                    <button>Edit</button>
                  </Link>
                  
                  <button 
                    onClick={() => handleDeleteClick(guru.id)}
                    style={{ marginLeft: '5px', backgroundColor: 'tomato', color: 'white' }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Tidak ada data guru.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GuruList;