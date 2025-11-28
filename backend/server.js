const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config(); 

const app = express();
const port = process.env.RAILWAY_PORT || process.env.PORT || 10000;
const saltRounds = 10;

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

// --- [PERBAIKAN UTAMA DI SINI] ---
// MENGGUNAKAN POOL AGAR KONEKSI TIDAK PUTUS (TIMEOUT)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Database Pool Created & Ready...');
// ----------------------------------


// --- API SISWA ---
app.get('/api/siswa', (req, res) => {
  const { kelas } = req.query; 
  let sql = "SELECT * FROM siswa";
  const params = [];
  if (kelas) { sql += " WHERE kelas = ?"; params.push(kelas); }
  sql += " ORDER BY nama ASC"; 
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send({ message: 'Error fetching data' });
    res.json(results);
  });
});

app.post('/api/siswa', (req, res) => {
  const { nama, nis, kelas } = req.body;
  if (!nama || !nis || !kelas) return res.status(400).send({ message: 'Wajib diisi!' });
  const sql = "INSERT INTO siswa (nama, nis, kelas) VALUES (?, ?, ?)";
  db.query(sql, [nama, nis, kelas], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: 'NIS terdaftar.' });
      return res.status(500).send({ message: 'Error saving data' });
    }
    res.status(201).send({ message: 'Siswa berhasil ditambahkan!', insertedId: result.insertId });
  });
});

app.get('/api/siswa/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM siswa WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).send({ message: 'Error fetching data' });
    if (results.length === 0) return res.status(404).send({ message: 'Not found' });
    res.json(results[0]); 
  });
});

app.put('/api/siswa/:id', (req, res) => {
  const { id } = req.params;
  const { nama, nis, kelas } = req.body;
  if (!nama || !nis || !kelas) return res.status(400).send({ message: 'Wajib diisi!' });
  const sql = "UPDATE siswa SET nama = ?, nis = ?, kelas = ? WHERE id = ?";
  db.query(sql, [nama, nis, kelas, id], (err, result) => {
    if (err) {
       if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: 'NIS terdaftar.' });
       return res.status(500).send({ message: 'Error update' });
    }
    res.status(200).send({ message: 'Siswa berhasil diupdate!' });
  });
});

app.delete('/api/siswa/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM siswa WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ message: 'Error delete' });
    res.status(200).send({ message: 'Siswa dihapus!' });
  });
});

// --- API GURU ---
app.get('/api/guru', (req, res) => {
  const sql = "SELECT * FROM guru";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send({ message: 'Error fetching guru' });
    res.json(results);
  });
});

app.post('/api/guru', (req, res) => {
  const { nama, nip, mapel, tgl_lahir } = req.body; 
  if (!nama || !nip || !mapel || !tgl_lahir) return res.status(400).send({ message: 'Semua field wajib diisi!' });

  const sqlGuru = "INSERT INTO guru (nama, nip, mapel, tgl_lahir) VALUES (?, ?, ?, ?)";
  db.query(sqlGuru, [nama, nip, mapel, tgl_lahir], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: 'NIP sudah terdaftar.' });
      return res.status(500).send({ message: 'Error saving guru' });
    }

    const username = nip;
    const parts = tgl_lahir.split('-');
    const passwordPlain = parts[2] + parts[1] + parts[0]; 

    bcrypt.hash(passwordPlain, saltRounds, (errHash, hash) => {
      if (errHash) return res.status(500).send({ message: 'Error generating password' });

      const sqlUser = "INSERT INTO users (username, password, role) VALUES (?, ?, 'guru')";
      db.query(sqlUser, [username, hash], (errUser, resUser) => {
        if (errUser) console.error("Gagal buat akun:", errUser);
        res.status(201).send({ message: 'Guru ditambahkan! Password: DDMMYYYY' });
      });
    });
  });
});

app.get('/api/guru/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM guru WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).send({ message: 'Error' });
    if (results.length === 0) return res.status(404).send({ message: 'Not found' });
    res.json(results[0]); 
  });
});

app.put('/api/guru/:id', (req, res) => {
  const { id } = req.params;
  const { nama, nip, mapel, tgl_lahir } = req.body;
  if (!nama || !nip || !mapel) return res.status(400).send({ message: 'Wajib diisi!' });
  
  const sql = "UPDATE guru SET nama = ?, nip = ?, mapel = ?, tgl_lahir = ? WHERE id = ?";
  db.query(sql, [nama, nip, mapel, tgl_lahir || '2000-01-01', id], (err, result) => {
    if (err) {
       if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: 'NIP terdaftar.' });
       return res.status(500).send({ message: 'Error update' });
    }
    res.status(200).send({ message: 'Guru berhasil diupdate!' });
  });
});

app.delete('/api/guru/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM guru WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ message: 'Error delete' });
    res.status(200).send({ message: 'Guru dihapus!' });
  });
});

// --- API KELAS ---
app.get('/api/kelas', (req, res) => {
  const sql = "SELECT * FROM kelas ORDER BY nama_kelas ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send({ message: 'Error' });
    res.json(results);
  });
});

app.post('/api/kelas', (req, res) => {
  const { nama_kelas } = req.body;
  if (!nama_kelas) return res.status(400).send({ message: 'Wajib diisi!' });
  const sql = "INSERT INTO kelas (nama_kelas) VALUES (?)";
  db.query(sql, [nama_kelas], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: 'Kelas ada.' });
      return res.status(500).send({ message: 'Error save' });
    }
    res.status(201).send({ message: 'Kelas ditambahkan!' });
  });
});

app.delete('/api/kelas/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM kelas WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ message: 'Error delete' });
    res.status(200).send({ message: 'Kelas dihapus!' });
  });
});

// --- API JADWAL ---
app.post('/api/jadwal', (req, res) => {
  const { hari, jam_mulai, jam_selesai, mapel, guru_id, kelas_id } = req.body;
  if (!hari || !jam_mulai || !jam_selesai || !mapel || !guru_id || !kelas_id) return res.status(400).send({ message: 'Lengkapi data!' });
  const sql = "INSERT INTO jadwal_pelajaran (hari, jam_mulai, jam_selesai, mapel, guru_id, kelas_id) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [hari, jam_mulai, jam_selesai, mapel, guru_id, kelas_id], (err, result) => {
    if (err) return res.status(500).send({ message: 'Gagal simpan jadwal.' });
    res.status(201).send({ message: 'Jadwal ditambahkan!' });
  });
});

app.get('/api/jadwal', (req, res) => {
  const sql = `
    SELECT j.*, g.nama as nama_guru, k.nama_kelas 
    FROM jadwal_pelajaran j
    JOIN guru g ON j.guru_id = g.id
    JOIN kelas k ON j.kelas_id = k.id
    ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), j.jam_mulai ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send({ message: 'Error fetch jadwal' });
    res.json(results);
  });
});

app.delete('/api/jadwal/:id', (req, res) => {
  const sql = "DELETE FROM jadwal_pelajaran WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send({ message: 'Gagal hapus' });
    res.json({ message: 'Jadwal dihapus' });
  });
});

// [DIUPDATE] Cek Jadwal Aktif (Filter by Guru jika ada)
app.get('/api/jadwal/aktif', (req, res) => {
  const { guru_id } = req.query; // [BARU] Terima parameter guru_id
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariIni = days[now.getDay()];
  const jamSekarang = now.toTimeString().split(' ')[0]; 

  let sql = `
    SELECT j.*, g.nama as nama_guru, k.nama_kelas 
    FROM jadwal_pelajaran j
    JOIN guru g ON j.guru_id = g.id
    JOIN kelas k ON j.kelas_id = k.id
    WHERE j.hari = ? 
    AND ? BETWEEN j.jam_mulai AND j.jam_selesai
  `;
  
  const params = [hariIni, jamSekarang];

  // [BARU] Jika yang request adalah Guru, filter jadwal dia saja
  if (guru_id) {
    sql += " AND j.guru_id = ?";
    params.push(guru_id);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send({ message: 'Error checking schedule' });
    res.json(results);
  });
});

// --- API AUTH (LOGIN - MENCARI ID GURU) ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send({ message: 'Wajib diisi!' });
  
  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    // [PERBAIKAN] Tambahkan console.error supaya muncul di Log Railway
    if (err) {
        console.error(">>> ERROR SAAT LOGIN (DATABASE):", err); 
        return res.status(500).send({ message: 'Server error (Cek Log)' });
    }

    if (results.length === 0) {
        console.warn(">>> LOGIN GAGAL: Username tidak ditemukan ->", username);
        return res.status(401).send({ message: 'Username/Password salah!' });
    }
    
    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      // [PERBAIKAN] Tambahkan console.error di sini juga
      if (err) {
          console.error(">>> ERROR SAAT CEK PASSWORD:", err);
          return res.status(500).send({ message: 'Error compare' });
      }

      if (!isMatch) {
          console.warn(">>> LOGIN GAGAL: Password salah untuk ->", username);
          return res.status(401).send({ message: 'Username/Password salah!' });
      }
      
      // [BARU] Jika role guru, cari ID Guru-nya berdasarkan NIP (username)
      if (user.role === 'guru') {
        const sqlGuru = "SELECT id FROM guru WHERE nip = ?";
        db.query(sqlGuru, [user.username], (errGuru, resGuru) => {
          let guruId = null;
          if (!errGuru && resGuru.length > 0) {
            guruId = resGuru[0].id;
          } else if (errGuru) {
             console.error(">>> ERROR CARI ID GURU:", errGuru);
          }
          
          const tokenPayload = { id: user.id, username: user.username, role: user.role, guruId: guruId };
          const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
          
          
          res.status(200).send({ 
            message: 'Login berhasil!', 
            token, 
            role: user.role, 
            username: user.username,
            guruId: guruId 
          });
        });
      } else {
        // Jika Admin, guruId null
        const tokenPayload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).send({ message: 'Login berhasil!', token, role: user.role, username: user.username });
      }
    });
  });
});

// --- API ABSENSI ---
app.post('/api/absensi', upload.any(), (req, res) => {
  try {
    const { tanggal, jadwal_id, dataAbsen } = req.body;
    if (!tanggal || !dataAbsen) return res.status(400).send({ message: 'Data tidak lengkap.' });

    const parsedAbsensi = JSON.parse(dataAbsen);
    const files = req.files || []; 

    const sql = "INSERT INTO absensi (siswa_id, tanggal, status, jadwal_id, bukti_foto) VALUES ?";
    const values = parsedAbsensi.map(absen => {
      const fileBukti = files.find(f => f.fieldname === `bukti_${absen.siswa_id}`);
      return [absen.siswa_id, tanggal, absen.status, jadwal_id || null, fileBukti ? fileBukti.filename : null];
    });

    db.query(sql, [values], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: 'Sudah absen.' });
        return res.status(500).send({ message: 'Gagal simpan.' });
      }
      res.status(201).send({ message: `Absensi tersimpan.` });
    });
  } catch (error) {
    res.status(500).send({ message: 'Server error.' });
  }
});

// [DIUPDATE] Get Absensi (Filter by Guru jika ada)
app.get('/api/absensi', (req, res) => {
    const { tanggal, bulan, kelas, mapel, guru_id } = req.query; // [BARU] Terima guru_id
    
    let sql = `
        SELECT absensi.*, siswa.nama as nama_siswa, siswa.kelas,
            jadwal_pelajaran.mapel, jadwal_pelajaran.jam_mulai, jadwal_pelajaran.jam_selesai, guru.nama as nama_guru,
            jadwal_pelajaran.guru_id
        FROM absensi 
        JOIN siswa ON absensi.siswa_id = siswa.id
        LEFT JOIN jadwal_pelajaran ON absensi.jadwal_id = jadwal_pelajaran.id
        LEFT JOIN guru ON jadwal_pelajaran.guru_id = guru.id
    `;
    const params = [];
    let conditions = [];

    if (tanggal) { conditions.push("absensi.tanggal = ?"); params.push(tanggal); } 
    else if (bulan) { conditions.push("absensi.tanggal LIKE ?"); params.push(bulan + '-%'); }
    if (kelas) { conditions.push("siswa.kelas = ?"); params.push(kelas); }
    if (mapel) { conditions.push("jadwal_pelajaran.mapel = ?"); params.push(mapel); }
    
    // [BARU] Filter Guru: Jika ada guru_id, hanya tampilkan rekap pelajaran dia
    if (guru_id) { 
        conditions.push("jadwal_pelajaran.guru_id = ?"); 
        params.push(guru_id); 
    }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY absensi.tanggal ASC, jadwal_pelajaran.jam_mulai ASC, siswa.nama ASC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send({ message: 'Gagal ambil data.' });
        res.json(results);
    });
});

app.get('/api/absensi/siswa/:id', (req, res) => {
  const siswaId = req.params.id;
  const sql = `
    SELECT absensi.*, jadwal_pelajaran.mapel, jadwal_pelajaran.jam_mulai, guru.nama as nama_guru
    FROM absensi
    LEFT JOIN jadwal_pelajaran ON absensi.jadwal_id = jadwal_pelajaran.id
    LEFT JOIN guru ON jadwal_pelajaran.guru_id = guru.id
    WHERE absensi.siswa_id = ?
    ORDER BY absensi.tanggal DESC
  `;
  db.query(sql, [siswaId], (err, results) => {
    if (err) return res.status(500).send({ message: 'Error history' });
    res.json(results);
  });
});

app.get('/api/dashboard', (req, res) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM siswa) AS totalSiswa,
      (SELECT COUNT(*) FROM guru) AS totalGuru,
      (SELECT COUNT(*) FROM kelas) AS totalKelas,
      (SELECT COUNT(*) FROM absensi WHERE status='hadir') AS totalHadir,
      (SELECT COUNT(*) FROM absensi WHERE status='sakit') AS totalSakit,
      (SELECT COUNT(*) FROM absensi WHERE status='izin') AS totalIzin,
      (SELECT COUNT(*) FROM absensi WHERE status='alfa') AS totalAlfa
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send({ message: 'Error fetching stats' });
    res.json(results[0]);
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`>>> KODINGAN BARU SUDAH MASUK! Server listen on ${port}`);
});