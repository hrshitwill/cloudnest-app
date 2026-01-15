
# Cloudnest App

This repository contains the Cloudnest frontend (React) and a minimal backend (Express) for file uploads and metadata.

Quick start (development)

1. Install dependencies

```bash
cd /Users/hashit/cloudnest-app
npm install --legacy-peer-deps
```

2. Start the backend server

```bash
npm run start:server
# server listens on http://localhost:4000
```

3. Start the frontend

```bash
npm start
# usually available at http://localhost:3000
```

4. Upload files

Use the UI or curl to POST multipart form data to `/upload`:

```bash
curl -F "file=@/path/to/file.txt" http://localhost:4000/upload
```

Notes
- `server/uploads/` holds uploaded files (ignored by git).
- `server/metadata.json` stores upload metadata (ignored by git).

License: MIT
