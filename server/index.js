const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const META_FILE = path.join(__dirname, 'metadata.json');

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

const upload = multer({ storage });

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

// Delete a file and its metadata entry
app.delete('/files/:id', (req, res) => {
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
