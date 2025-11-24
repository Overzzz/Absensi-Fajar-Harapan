import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom'; 
import axios from 'axios';
import './App.css';

// Import komponen
import LoginPage from './components/Login';
import SiswaList from './components/SiswaList';
import SiswaForm from './components/SiswaForm';
import SiswaEdit from './components/SiswaEdit'; 
import SiswaDetail from './components/SiswaDetail'; // [PENTING] Import Detail Siswa
import GuruList from './components/GuruList';
import GuruForm from './components/GuruForm';
import GuruEdit from './components/GuruEdit';
import AbsenPage from './components/AbsenPage'; 
import RekapPage from './components/RekapPage'; 
import RekapBulanan from './components/RekapBulanan';
import KelasManager from './components/KelasManager';
import Dashboard from './components/Dashboard';
import JadwalManager from './components/JadwalManager';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role')); 
  
  // State untuk data master (agar bisa di-fetch di awal)
  const [siswaList, setSiswaList] = useState([]);
  const [siswaLoading, setSiswaLoading] = useState(true);
  const [siswaError, setSiswaError] = useState(null);
  
  const [guruList, setGuruList] = useState([]);
  const [guruLoading, setGuruLoading] = useState(true);
  const [guruError, setGuruError] = useState(null);
  
  const handleLogout = () => {
    setToken(null); 
    setRole(null); 
    localStorage.removeItem('token'); 
    localStorage.removeItem('role');
  };

  // Fungsi Fetch Siswa
  const fetchSiswa = async () => {
    if (!token) { setSiswaLoading(false); return; }
    try {
      setSiswaLoading(true);
      const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/siswa', {headers: { Authorization: `Bearer ${token}` }});
      setSiswaList(response.data);
      setSiswaError(null);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) handleLogout();
      else setSiswaError("Gagal mengambil data siswa.");
    } finally { setSiswaLoading(false); }
  };
  const handleSiswaAdded = () => { fetchSiswa(); };
  const handleSiswaDelete = async (idSiswa) => {
    if (window.confirm('Hapus siswa ini?')) {
      try { await axios.delete(`https://absensi-fajar-harapan-production.up.railway.app/api/siswa/${idSiswa}`, {headers: { Authorization: `Bearer ${token}` }}); fetchSiswa(); 
      } catch (err) { alert('Gagal menghapus siswa.'); }
    }
  };
  
  // Fungsi Fetch Guru
  const fetchGuru = async () => {
    if (!token) { setGuruLoading(false); return; }
    try {
      setGuruLoading(true);
      const response = await axios.get('https://absensi-fajar-harapan-production.up.railway.app/api/guru', {headers: { Authorization: `Bearer ${token}` }});
      setGuruList(response.data);
      setGuruError(null);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) handleLogout();
      else setGuruError("Gagal mengambil data guru.");
    } finally { setGuruLoading(false); }
  };
  const handleGuruAdded = () => { fetchGuru(); };
  const handleGuruDelete = async (idGuru) => {
    if (window.confirm('Hapus guru ini?')) {
      try { await axios.delete(`https://absensi-fajar-harapan-production.up.railway.app/api/guru/${idGuru}`, {headers: { Authorization: `Bearer ${token}` }}); fetchGuru();
      } catch (err) { alert('Gagal menghapus guru.'); }
    }
  };

  // Fetch data saat pertama kali login
  useEffect(() => { 
    if(token){ 
      setRole(localStorage.getItem('role'));
      fetchSiswa(); 
      fetchGuru(); 
    } 
  }, [token]); 
  
  // Jika belum login -> Tampilkan Login Page
  if (!token) return <div className="login-wrapper">
    <LoginPage setToken={(t) => {
      setToken(t);
      setRole(localStorage.getItem('role'));
    }} />
  </div>;

  return (
    <div className="dashboard-container">
      
      <aside className="sidebar">
        <div className="sidebar-header">ABSENSI SMAN 10 FAJAR HARAPAN</div>
        
        <div style={{ textAlign: 'center', padding: '10px', color: '#aaa', fontSize: '12px', borderBottom: '1px solid #444' }}>
          Login sebagai: <br/>
          <strong style={{ color: 'white', fontSize: '14px', textTransform: 'uppercase' }}>{role}</strong>
        </div>

        <nav className="sidebar-menu">
          <Link to="/">🏠 Dashboard</Link>
          
          {/* Menu khusus Admin */}
          {role === 'admin' && (
            <>
              <div style={{ padding: '10px 15px', fontSize: '11px', textTransform: 'uppercase', color: '#6c757d', fontWeight: 'bold', marginTop: '10px' }}>Master Data</div>
              <Link to="/siswa">👨‍🎓 Data Siswa</Link>
              <Link to="/guru">👩‍🏫 Data Guru</Link>
              <Link to="/kelas">🏫 Data Kelas</Link>
              <Link to="/jadwal">📅 Atur Jadwal</Link>
            </>
          )}

          <div style={{ padding: '10px 15px', fontSize: '11px', textTransform: 'uppercase', color: '#6c757d', fontWeight: 'bold', marginTop: '10px' }}>Absensi</div>
          <Link to="/absensi">📝 Ambil Absen</Link>
          <Link to="/rekap-harian">📊 Rekap Harian</Link>
          <Link to="/rekap-bulanan">📈 Rekap Bulanan</Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            
            {/* Rute Siswa */}
            <Route path="/siswa" element={<SiswaList siswaList={siswaList} loading={siswaLoading} error={siswaError} onDelete={handleSiswaDelete}/>} />
            <Route path="/siswa/tambah" element={<SiswaForm onSiswaAdded={handleSiswaAdded} token={token} />} />
            <Route path="/siswa/edit/:id" element={<SiswaEdit token={token} />} />
            <Route path="/siswa/:id" element={<SiswaDetail token={token} />} /> {/* [BARU] Detail Siswa */}
            
            {/* Rute Guru */}
            <Route path="/guru" element={<><GuruForm onGuruAdded={handleGuruAdded} token={token} /><hr /><GuruList guruList={guruList} loading={guruLoading} error={guruError} onDelete={handleGuruDelete}/></>} />
            <Route path="/guru/edit/:id" element={<GuruEdit token={token} />} />
            
            {/* Rute Lainnya */}
            <Route path="/kelas" element={<KelasManager token={token} />} />
            <Route path="/jadwal" element={<JadwalManager token={token} />} />
            
            <Route path="/absensi" element={<AbsenPage token={token} />} />
            <Route path="/rekap-harian" element={<RekapPage token={token} />} />
            <Route path="/rekap-bulanan" element={<RekapBulanan token={token} />} />
          </Routes>
        </div>
      </main>

    </div>
  );
}

export default App;