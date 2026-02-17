const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware per JSON
app.use(express.json());

// 🔐 CONFIGURAZIONE
const SECRET_PATH = '/laurea-Red_Richard'; // CAMBIA QUESTO
const EXPIRATION_DATE = new Date('2026-03-02T23:59:59'); // CAMBIA DATA
const ADMIN_PASSWORD = 'admin123'; // CAMBIA QUESTA PASSWORD!

// ==============================
// CONFIGURAZIONE MULTER (UPLOAD)
// ==============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'foto');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Mantieni il nome originale del file
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max per file
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse!'));
    }
  }
});

// ==============================
// ROTTE ADMIN
// ==============================

// Login admin
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Password errata' });
  }
});

// Serve pagina admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Script admin
app.get('/admin-script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-script.js'));
});

// Lista foto per admin
app.get('/admin/photos', (req, res) => {
  const photosDir = path.join(__dirname, 'public', 'foto');

  if (!fs.existsSync(photosDir)) {
    return res.json([]);
  }

  fs.readdir(photosDir, (err, files) => {
    if (err) {
      return res.json([]);
    }

    const photos = files.filter(file =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    res.json(photos);
  });
});

// Upload foto (multiplo)
app.post('/admin/upload', upload.array('photos', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Nessun file caricato' });
  }

  res.json({
    success: true,
    uploaded: req.files.length,
    files: req.files.map(f => f.filename)
  });
});

// Elimina foto
app.delete('/admin/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'foto', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File non trovato' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Errore durante eliminazione' });
    }
    res.json({ success: true, message: 'File eliminato' });
  });
});

// ==============================
// CONTROLLO SCADENZA LINK PUBBLICO
// ==============================
app.use(SECRET_PATH, (req, res, next) => {
  const now = new Date();

  if (now > EXPIRATION_DATE) {
    return res.sendFile(path.join(__dirname, 'public', 'scaduto.html'));
  }

  next();
});

// ==============================
// FILE STATICI PUBBLICI
// ==============================
app.use(
  SECRET_PATH,
  express.static(path.join(__dirname, 'public'))
);

// ==============================
// API: LISTA FOTO PUBBLICA
// ==============================
app.get(`${SECRET_PATH}/api/photos`, (req, res) => {
  const photosDir = path.join(__dirname, 'public', 'foto');

  if (!fs.existsSync(photosDir)) {
    return res.json([]);
  }

  fs.readdir(photosDir, (err, files) => {
    if (err) {
      return res.json([]);
    }

    const photos = files.filter(file =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    res.json(photos);
  });
});

// ==============================
// DOWNLOAD FOTO
// ==============================
app.get(`${SECRET_PATH}/download/:filename`, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'foto', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Foto non trovata');
  }

  res.download(filePath);
});

// ==============================
// BLOCCA TUTTO IL RESTO
// ==============================
app.get('*', (req, res) => {
  res.status(404).send('⛔ Accesso non consentito');
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`✔ Server avviato sulla porta ${PORT}`);
  console.log(`🔗 Link evento: http://localhost:${PORT}${SECRET_PATH}`);
  console.log(`👤 Area admin: http://localhost:${PORT}/admin`);
  console.log(`🔐 Password admin: ${ADMIN_PASSWORD}`);
  console.log(`⏳ Scadenza: ${EXPIRATION_DATE.toLocaleString()}`);
});
/*
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 CONFIGURAZIONE
const SECRET_PATH = '/laurea-Red_Richard'; // CAMBIA QUESTO
const EXPIRATION_DATE = new Date('2026-03-02T23:59:59'); // CAMBIA DATA

// ==============================
// CONTROLLO SCADENZA LINK
// ==============================
app.use(SECRET_PATH, (req, res, next) => {
  const now = new Date();

  if (now > EXPIRATION_DATE) {
    return res
      .status(403)
      .send('<h1>⏳ Link scaduto</h1><p>Le foto non sono più disponibili.</p>');
  }

  next();
});

// ==============================
// FILE STATICI
// ==============================
app.use(
  SECRET_PATH,
  express.static(path.join(__dirname, '..', 'public'))
);

// ==============================
// API: LISTA FOTO
// ==============================
app.get(`${SECRET_PATH}/api/photos`, (req, res) => {
  const photosDir = path.join(__dirname, '..', 'public', 'foto');

  if (!fs.existsSync(photosDir)) {
    return res.json([]);
  }

  fs.readdir(photosDir, (err, files) => {
    if (err) {
      return res.json([]);
    }

    const photos = files.filter(file =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    res.json(photos);
  });
});

// ==============================
// DOWNLOAD FOTO
// ==============================
app.get(`${SECRET_PATH}/download/:filename`, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'public', 'foto', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Foto non trovata');
  }

  res.download(filePath);
});

// ==============================
// BLOCCA TUTTO IL RESTO
// ==============================
app.get('*', (req, res) => {
  res.status(404).send('⛔ Accesso non consentito');
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`✓ Server avviato sulla porta ${PORT}`);
  console.log(`🔗 Link evento: http://localhost:${PORT}${SECRET_PATH}`);
  console.log(`⏳ Scadenza: ${EXPIRATION_DATE.toLocaleString()}`);
});
*/