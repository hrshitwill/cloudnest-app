const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// load .env in development
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) { /* ignore if not installed */ }
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(helmet());

// Basic rate limiting
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX_REQ || 300)
}));

const UPLOADS_DIR = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(__dirname, 'uploads');
const META_FILE = process.env.META_FILE ? path.resolve(process.env.META_FILE) : path.join(__dirname, 'metadata.json');
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024); // 10 MB
const ALLOWED_MIME = (process.env.ALLOWED_MIME || 'image/jpeg,image/png,text/plain,application/pdf').split(',');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({ files: [] }, null, 2));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type'), false);
};

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE }, fileFilter });

function readMeta() {
  try {
    return JSON.parse(fs.readFileSync(META_FILE));
  } catch (e) {
    return { files: [] };
  }
}

function writeMeta(data) {
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const userMeta = req.body.metadata ? JSON.parse(req.body.metadata) : {};

  const meta = readMeta();
  const entry = {
    id: Date.now().toString(36) + Math.round(Math.random() * 1e9).toString(36),
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: '/uploads/' + req.file.filename,
    uploadedAt: new Date().toISOString(),
    metadata: userMeta
  };

  meta.files.unshift(entry);
  writeMeta(meta);

  res.json({ success: true, file: entry });
});

app.get('/files', (req, res) => {
  const meta = readMeta();
  res.json(meta.files);
});

app.get('/files/:id', (req, res) => {
  const meta = readMeta();
  const f = meta.files.find(x => x.id === req.params.id);
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json(f);
});

// simple auth middleware (optional)
function requireToken(req, res, next) {
  const token = (req.headers['x-api-key'] || (req.headers.authorization || '').replace('Bearer ', '')) || null;
  if (!process.env.AUTH_TOKEN) return next(); // no auth configured
  if (token === process.env.AUTH_TOKEN) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Delete a file and its metadata entry (protected by optional token)
app.delete('/files/:id', requireToken, (req, res) => {
  const meta = readMeta();
  const idx = meta.files.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const entry = meta.files[idx];
  // Remove from metadata
  meta.files.splice(idx, 1);
  writeMeta(meta);
  // Try to delete the file on disk
  const filePath = path.join(UPLOADS_DIR, entry.filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error('Failed to delete file:', e);
  }
  res.json({ success: true });
});

app.get('/uploads/:name', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Cloudnest file server running on http://localhost:${PORT}`);
});
