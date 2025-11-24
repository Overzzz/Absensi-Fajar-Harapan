import React, { useState } from 'react';
import axios from 'axios';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const url = 'https://absensi-fajar-harapan-production.up.railway.app/api/login';
    const data = { username, password };

    try {
      const response = await axios.post(url, data);
      const token = response.data.token;
      const role = response.data.role;
      const guruId = response.data.guruId; // [BARU] Ambil guruId dari backend
        
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      
      // [BARU] Simpan guruId jika ada
      if (guruId) {
        localStorage.setItem('guruId', guruId);
      } else {
        localStorage.removeItem('guruId'); // Hapus sisa login sebelumnya jika admin
      }

    } catch (err) {
      if (err.response) {
        setMessage({ type: 'error', text: err.response.data.message });
      } else {
        setMessage({ type: 'error', text: 'Gagal terhubung ke server.' });
      }
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎓</div>
        <h2>Selamat Datang</h2>
        <p>Silakan login menggunakan NIP dan Tanggal Lahir Anda</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username (NIP)</label>
          <input 
            type="text" 
            className="form-control"
            placeholder="Masukkan NIP"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            className="form-control"
            placeholder="Contoh: 17081990 (Tanpa Strip)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        <button type="submit" className="btn-login">
          Masuk Dashboard
        </button>
      </form>
      
      {message && (
        <div className={`alert-box ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#aaa' }}>
        Belum punya akun? Hubungi Admin Sekolah.
      </div>
    </div>
  );
}

export default Login;