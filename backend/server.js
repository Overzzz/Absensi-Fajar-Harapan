const express = require('express');
const { Pool } = require('pg');
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

// --- KONEKSI DATABASE (POSTGRESQL) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false 
  },
  max: 10 
});

console.log('Database Pool Created & Ready (PostgreSQL)...');

// Helper function query
const query = (text, params) => pool.query(text, params);

// ----------------------------------


// --- API SISWA ---
app.get('/api/siswa', async (req, res) => {
  const { kelas } = req.query; 
  let sql = "SELECT * FROM siswa";
  const params = [];
  if (kelas) { 
      sql += " WHERE kelas = $1"; 
      params.push(kelas); 
  }
  sql += " ORDER BY nama ASC"; 
  
  try {
      const { rows } = await query(sql, params); 
      res.json(rows);
  } catch (err) {
      res.status(500).send({ message: 'Error fetching data' });
  }
});

app.post('/api/siswa', async (req, res) => {
  const { nama, nis, kelas } = req.body;
  if (!nama || !nis || !kelas) return res.status(400).send({ message: 'Wajib diisi!' });
  
  const sql = "INSERT INTO siswa (nama, nis, kelas) VALUES ($1, $2, $3) RETURNING id";
  
  try {
      const result = await query(sql, [nama, nis, kelas]);
      res.status(201).send({ message: 'Siswa berhasil ditambahkan!', insertedId: result.rows[0].id });
  } catch (err) {
      if (err.code === '23505') return res.status(400).send({ message: 'NIS terdaftar.' }); 
      return res.status(500).send({ message: 'Error saving data' });
  }
});

app.get('/api/siswa/:id', async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM siswa WHERE id = $1";
  try {
      const { rows } = await query(sql, [id]);
      if (rows.length === 0) return res.status(404).send({ message: 'Not found' });
      res.json(rows[0]); 
  } catch (err) {
      res.status(500).send({ message: 'Error fetching data' });
  }
});

app.put('/api/siswa/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, nis, kelas } = req.body;
  if (!nama || !nis || !kelas) return res.status(400).send({ message: 'Wajib diisi!' });
  
  const sql = "UPDATE siswa SET nama = $1, nis = $2, kelas = $3 WHERE id = $4";
  try {
      await query(sql, [nama, nis, kelas, id]);
      res.status(200).send({ message: 'Siswa berhasil diupdate!' });
  } catch (err) {
      if (err.code === '23505') return res.status(400).send({ message: 'NIS terdaftar.' });
      return res.status(500).send({ message: 'Error update' });
  }
});

app.delete('/api/siswa/:id', async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM siswa WHERE id = $1";
  try {
      await query(sql, [id]);
      res.status(200).send({ message: 'Siswa dihapus!' });
  } catch (err) {
      res.status(500).send({ message: 'Error delete' });
  }
});

// --- API GURU ---
app.get('/api/guru', async (req, res) => {
  const sql = "SELECT * FROM guru";
  try {
      const { rows } = await query(sql);
      res.json(rows);
  } catch (err) {
      res.status(500).send({ message: 'Error fetching guru' });
  }
});

app.post('/api/guru', async (req, res) => {
  const { nama, nip, mapel, tgl_lahir } = req.body; 
  if (!nama || !nip || !mapel || !tgl_lahir) return res.status(400).send({ message: 'Semua field wajib diisi!' });

  const sqlGuru = "INSERT INTO guru (nama, nip, mapel, tgl_lahir) VALUES ($1, $2, $3, $4)";
  
  try {
      await query(sqlGuru, [nama, nip, mapel, tgl_lahir]);
      
      const username = nip;
      const parts = tgl_lahir.split('-');
      const passwordPlain = parts[2] + parts[1] + parts[0]; 

      const hash = await bcrypt.hash(passwordPlain, saltRounds);
      
      const sqlUser = "INSERT INTO users (username, password, role) VALUES ($1, $2, 'guru')";
      await query(sqlUser, [username, hash]);
      
      res.status(201).send({ message: 'Guru ditambahkan! Password: DDMMYYYY' });

  } catch (err) {
      if (err.code === '23505') return res.status(400).send({ message: 'NIP/Username sudah terdaftar.' });
      console.error(err);
      return res.status(500).send({ message: 'Error saving guru' });
  }
});

app.get('/api/guru/:id', async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM guru WHERE id = $1";
  try {
      const { rows } = await query(sql, [id]);
      if (rows.length === 0) return res.status(404).send({ message: 'Not found' });
      res.json(rows[0]);
  } catch (err) {
      res.status(500).send({ message: 'Error' });
  }
});

app.put('/api/guru/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, nip, mapel, tgl_lahir } = req.body;
  if (!nama || !nip || !mapel) return res.status(400).send({ message: 'Wajib diisi!' });
  
  const sql = "UPDATE guru SET nama = $1, nip = $2, mapel = $3, tgl_lahir = $4 WHERE id = $5";
  try {
      await query(sql, [nama, nip, mapel, tgl_lahir || '2000-01-01', id]);
      res.status(200).send({ message: 'Guru berhasil diupdate!' });
  } catch (err) {
       if (err.code === '23505') return res.status(400).send({ message: 'NIP terdaftar.' });
       return res.status(500).send({ message: 'Error update' });
  }
});

app.delete('/api/guru/:id', async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM guru WHERE id = $1";
  try {
      await query(sql, [id]);
      res.status(200).send({ message: 'Guru dihapus!' });
  } catch (err) {
      res.status(500).send({ message: 'Error delete' });
  }
});

// --- API KELAS ---
app.get('/api/kelas', async (req, res) => {
  const sql = "SELECT * FROM kelas ORDER BY nama_kelas ASC";
  try {
      const { rows } = await query(sql);
      res.json(rows);
  } catch (err) {
      res.status(500).send({ message: 'Error' });
  }
});

app.post('/api/kelas', async (req, res) => {
  const { nama_kelas } = req.body;
  if (!nama_kelas) return res.status(400).send({ message: 'Wajib diisi!' });
  const sql = "INSERT INTO kelas (nama_kelas) VALUES ($1)";
  try {
      await query(sql, [nama_kelas]);
      res.status(201).send({ message: 'Kelas ditambahkan!' });
  } catch (err) {
      if (err.code === '23505') return res.status(400).send({ message: 'Kelas ada.' });
      return res.status(500).send({ message: 'Error save' });
  }
});

app.delete('/api/kelas/:id', async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM kelas WHERE id = $1";
  try {
      await query(sql, [id]);
      res.status(200).send({ message: 'Kelas dihapus!' });
  } catch (err) {
      res.status(500).send({ message: 'Error delete' });
  }
});

// --- API JADWAL ---
app.post('/api/jadwal', async (req, res) => {
  const { hari, jam_mulai, jam_selesai, mapel, guru_id, kelas_id } = req.body;
  if (!hari || !jam_mulai || !jam_selesai || !mapel || !guru_id || !kelas_id) return res.status(400).send({ message: 'Lengkapi data!' });
  const sql = "INSERT INTO jadwal_pelajaran (hari, jam_mulai, jam_selesai, mapel, guru_id, kelas_id) VALUES ($1, $2, $3, $4, $5, $6)";
  try {
      await query(sql, [hari, jam_mulai, jam_selesai, mapel, guru_id, kelas_id]);
      res.status(201).send({ message: 'Jadwal ditambahkan!' });
  } catch (err) {
      res.status(500).send({ message: 'Gagal simpan jadwal.' });
  }
});

app.get('/api/jadwal', async (req, res) => {
  const sql = `
    SELECT j.*, g.nama as nama_guru, k.nama_kelas 
    FROM jadwal_pelajaran j
    JOIN guru g ON j.guru_id = g.id
    JOIN kelas k ON j.kelas_id = k.id
    ORDER BY 
      CASE j.hari
        WHEN 'Senin' THEN 1
        WHEN 'Selasa' THEN 2
        WHEN 'Rabu' THEN 3
        WHEN 'Kamis' THEN 4
        WHEN 'Jumat' THEN 5
        WHEN 'Sabtu' THEN 6
        WHEN 'Minggu' THEN 7
        ELSE 8
      END,
      j.jam_mulai ASC
  `;
  try {
      const { rows } = await query(sql);
      res.json(rows);
  } catch (err) {
      res.status(500).send({ message: 'Error fetch jadwal' });
  }
});

app.delete('/api/jadwal/:id', async (req, res) => {
  const sql = "DELETE FROM jadwal_pelajaran WHERE id = $1";
  try {
      await query(sql, [req.params.id]);
      res.json({ message: 'Jadwal dihapus' });
  } catch (err) {
      res.status(500).send({ message: 'Gagal hapus' });
  }
});

// --- [DIPERBAIKI] API CEK JADWAL AKTIF (TIMEZONE WIB) ---
app.get('/api/jadwal/aktif', async (req, res) => {
  const { guru_id } = req.query; 
  
  // 1. Ambil waktu sekarang (UTC di server)
  const now = new Date();
  
  // 2. Ubah Jam ke Waktu Jakarta (WIB)
  // en-GB formatnya HH:MM:SS (24 jam), cocok sama format Database
  const jamSekarang = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta' });
  
  // 3. Ubah Hari ke Waktu Jakarta
  // Trik: Convert ke string Jakarta, baru jadikan Date lagi buat ambil getDay()
  const jakartaDateString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const dateInJakarta = new Date(jakartaDateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariIni = days[dateInJakarta.getDay()];
  
  // Debug Log (biar kelihatan di Koyeb lognya apa)
  console.log(`>>> CEK JADWAL: Hari=${hariIni}, Jam=${jamSekarang} (WIB)`);

  let sql = `
    SELECT j.*, g.nama as nama_guru, k.nama_kelas 
    FROM jadwal_pelajaran j
    JOIN guru g ON j.guru_id = g.id
    JOIN kelas k ON j.kelas_id = k.id
    WHERE j.hari = $1 
    AND $2 BETWEEN j.jam_mulai AND j.jam_selesai
  `;
  
  const params = [hariIni, jamSekarang];

  if (guru_id) {
    sql += " AND j.guru_id = $3";
    params.push(guru_id);
  }

  try {
      const { rows } = await query(sql, params);
      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Error checking schedule' });
  }
});

// --- API AUTH ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send({ message: 'Wajib diisi!' });
  
  const sql = "SELECT * FROM users WHERE username = $1";
  
  try {
      const { rows } = await query(sql, [username]);
      
      if (rows.length === 0) {
          console.warn(">>> LOGIN GAGAL: Username tidak ditemukan ->", username);
          return res.status(401).send({ message: 'Username/Password salah!' });
      }
      
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          console.warn(">>> LOGIN GAGAL: Password salah untuk ->", username);
          return res.status(401).send({ message: 'Username/Password salah!' });
      }
      
      // Jika role guru, cari ID Guru
      let guruId = null;
      if (user.role === 'guru') {
        const sqlGuru = "SELECT id FROM guru WHERE nip = $1";
        const resGuru = await query(sqlGuru, [user.username]);
        if (resGuru.rows.length > 0) {
           guruId = resGuru.rows[0].id;
        }
      } 

      // Buat token
      const tokenPayload = { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        guruId: guruId 
      };
      
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
      
      res.status(200).send({ 
        message: 'Login berhasil!', 
        token, 
        role: user.role, 
        username: user.username,
        guruId: guruId 
      });

  } catch (err) {
      console.error(">>> ERROR SAAT LOGIN:", err); 
      return res.status(500).send({ message: 'Server error (Cek Log)' });
  }
});

// --- API ABSENSI (BULK INSERT) ---
app.post('/api/absensi', upload.any(), async (req, res) => {
  try {
    const { tanggal, jadwal_id, dataAbsen } = req.body;
    if (!tanggal || !dataAbsen) return res.status(400).send({ message: 'Data tidak lengkap.' });

    const parsedAbsensi = JSON.parse(dataAbsen);
    const files = req.files || []; 

    const insertPromises = parsedAbsensi.map(absen => {
      const fileBukti = files.find(f => f.fieldname === `bukti_${absen.siswa_id}`);
      const foto = fileBukti ? fileBukti.filename : null;
      
      const sql = `
         INSERT INTO absensi (siswa_id, tanggal, status, jadwal_id, bukti_foto) 
         VALUES ($1, $2, $3, $4, $5)
      `;
      return query(sql, [absen.siswa_id, tanggal, absen.status, jadwal_id || null, foto]);
    });

    await Promise.all(insertPromises);
    
    res.status(201).send({ message: `Absensi tersimpan.` });

  } catch (err) {
    if (err.code === '23505') return res.status(400).send({ message: 'Sudah absen.' });
    console.error(err);
    res.status(500).send({ message: 'Gagal simpan.' });
  }
});

// Get Absensi
app.get('/api/absensi', async (req, res) => {
    const { tanggal, bulan, kelas, mapel, guru_id } = req.query;
    
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
    let counter = 1; 

    if (tanggal) { 
        conditions.push(`absensi.tanggal = $${counter++}`); 
        params.push(tanggal); 
    } 
    else if (bulan) { 
        conditions.push(`absensi.tanggal::text LIKE $${counter++}`); 
        params.push(bulan + '-%'); 
    }
    if (kelas) { 
        conditions.push(`siswa.kelas = $${counter++}`); 
        params.push(kelas); 
    }
    if (mapel) { 
        conditions.push(`jadwal_pelajaran.mapel = $${counter++}`); 
        params.push(mapel); 
    }
    if (guru_id) { 
        conditions.push(`jadwal_pelajaran.guru_id = $${counter++}`); 
        params.push(guru_id); 
    }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY absensi.tanggal ASC, jadwal_pelajaran.jam_mulai ASC, siswa.nama ASC";

    try {
        const { rows } = await query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Gagal ambil data.' });
    }
});

app.get('/api/absensi/siswa/:id', async (req, res) => {
  const siswaId = req.params.id;
  const sql = `
    SELECT absensi.*, jadwal_pelajaran.mapel, jadwal_pelajaran.jam_mulai, guru.nama as nama_guru
    FROM absensi
    LEFT JOIN jadwal_pelajaran ON absensi.jadwal_id = jadwal_pelajaran.id
    LEFT JOIN guru ON jadwal_pelajaran.guru_id = guru.id
    WHERE absensi.siswa_id = $1
    ORDER BY absensi.tanggal DESC
  `;
  try {
      const { rows } = await query(sql, [siswaId]);
      res.json(rows);
  } catch (err) {
      res.status(500).send({ message: 'Error history' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM siswa) AS "totalSiswa",
      (SELECT COUNT(*) FROM guru) AS "totalGuru",
      (SELECT COUNT(*) FROM kelas) AS "totalKelas",
      (SELECT COUNT(*) FROM absensi WHERE status='hadir') AS "totalHadir",
      (SELECT COUNT(*) FROM absensi WHERE status='sakit') AS "totalSakit",
      (SELECT COUNT(*) FROM absensi WHERE status='izin') AS "totalIzin",
      (SELECT COUNT(*) FROM absensi WHERE status='alfa') AS "totalAlfa"
  `;
  try {
      const { rows } = await query(sql);
      const data = rows[0];
      const result = {
        totalSiswa: parseInt(data.totalSiswa),
        totalGuru: parseInt(data.totalGuru),
        totalKelas: parseInt(data.totalKelas),
        totalHadir: parseInt(data.totalHadir),
        totalSakit: parseInt(data.totalSakit),
        totalIzin: parseInt(data.totalIzin),
        totalAlfa: parseInt(data.totalAlfa),
      };
      res.json(result);
  } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Error fetching stats' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`>>> KODINGAN BARU POSTGRESQL + TIMEZONE WIB SIAP! Server listen on ${port}`);
});