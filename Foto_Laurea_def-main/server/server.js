const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==============================
// 🔐 CONFIGURAZIONE
// ==============================
const SECRET_PATH = '/laurea-Red_Richard';
const EXPIRATION_DATE = new Date('2026-03-02T23:59:59');
const ADMIN_PASSWORD = 'admin123';

// ==============================
// 📂 PERCORSO PUBLIC CORRETTO
// ==============================
const PUBLIC_PATH = path.join(__dirname, '../public');

// ==============================
// 📂 CONFIGURAZIONE MULTER
// ==============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(PUBLIC_PATH, 'foto');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse!'));
    }
  }
});

// ==============================
// 🔁 HOMEPAGE REDIRECT
// ==============================
app.get('/', (req, res) => {
  res.redirect(SECRET_PATH);
});

// ==============================
// 🔐 AREA ADMIN
// ==============================
app.post('/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-script.js'));
});

app.get('/admin/photos', (req, res) => {
  const photosDir = path.join(PUBLIC_PATH, 'foto');

  if (!fs.existsSync(photosDir)) {
    return res.json([]);
  }

  fs.readdir(photosDir, (err, files) => {
    if (err) return res.json([]);

    const photos = files.filter(file =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    res.json(photos);
  });
});

app.post('/admin/upload', upload.array('photos', 50), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false });
  }

  res.json({
    success: true,
    uploaded: req.files.length,
    files: req.files.map(f => f.filename)
  });
});

app.delete('/admin/delete/:filename', (req, res) => {
  const filePath = path.join(PUBLIC_PATH, 'foto', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false });
  }

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// ==============================
// ⏳ CONTROLLO SCADENZA
// ==============================
app.use(SECRET_PATH, (req, res, next) => {
  if (new Date() > EXPIRATION_DATE) {
    return res.sendFile(path.join(PUBLIC_PATH, 'scaduto.html'));
  }
  next();
});

// ==============================
// 📂 FILE STATICI
// ==============================
app.use(
  SECRET_PATH,
  express.static(PUBLIC_PATH)
);

// ==============================
// 📸 API FOTO PUBBLICHE
// ==============================
app.get(`${SECRET_PATH}/api/photos`, (req, res) => {
  const photosDir = path.join(PUBLIC_PATH, 'foto');

  if (!fs.existsSync(photosDir)) {
    return res.json([]);
  }

  fs.readdir(photosDir, (err, files) => {
    if (err) return res.json([]);

    const photos = files.filter(file =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    res.json(photos);
  });
});

// ==============================
// ⬇ DOWNLOAD FOTO
// ==============================
app.get(`${SECRET_PATH}/download/:filename`, (req, res) => {
  const filePath = path.join(PUBLIC_PATH, 'foto', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Foto non trovata');
  }

  res.download(filePath);
});

// ==============================
// 🚫 BLOCCA TUTTO IL RESTO
// ==============================
app.use((req, res) => {
  res.status(404).send('⛔ Accesso non consentito');
});

// ==============================
// ▶ START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`✔ Server avviato sulla porta ${PORT}`);
  console.log(`🔗 Link evento: http://localhost:${PORT}${SECRET_PATH}`);
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
