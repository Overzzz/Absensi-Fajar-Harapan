import React from 'react';
import { Link } from 'react-router-dom'; 

function SiswaList({ siswaList, loading, error, onDelete }) {
  
  if (loading) {
    return <div>Loading data siswa...</div>;
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
      {/* Header dengan Judul dan Tombol Tambah */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Daftar Siswa</h2>
        
        <Link to="/siswa/tambah">
          <button style={{ 
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '10px 15px', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            + Tambah Siswa
          </button>
        </Link>
      </div>
      
      <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>NIS</th>
            <th>Kelas</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {siswaList.length > 0 ? (
            siswaList.map(siswa => (
              <tr key={siswa.id}>
                <td style={{ textAlign: 'center' }}>{siswa.id}</td>
                
                {/* [DIUBAH] Nama siswa sekarang jadi Link ke halaman Detail */}
                <td>
                  <Link 
                    to={`/siswa/${siswa.id}`} 
                    style={{ 
                      textDecoration: 'none', 
                      color: '#4361ee', 
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {siswa.nama}
                  </Link>
                </td>

                <td>{siswa.nis}</td>
                <td style={{ textAlign: 'center' }}>{siswa.kelas}</td>
                <td style={{ textAlign: 'center' }}>
                  <Link to={`/siswa/edit/${siswa.id}`}>
                    <button style={{ marginRight: '5px', padding: '5px 10px' }}>Edit</button>
                  </Link>
                  
                  <button 
                    onClick={() => handleDeleteClick(siswa.id)}
                    style={{ backgroundColor: 'tomato', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>Tidak ada data siswa.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SiswaList;