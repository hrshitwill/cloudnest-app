
# Cloudnest App

This repository contains two parts:

- Frontend: React app in `src/` (Create React App)
- Backend: minimal Express server in `server/` that accepts file uploads and stores metadata

The sections below show how to run each piece independently and together.

Prerequisites
-----------
- Node.js (16+ recommended)
- npm

Install dependencies (run once)
--------------------------------

```bash
cd /Users/hashit/cloudnest-app
npm install --legacy-peer-deps
```

Frontend (React)
-----------------

Location: `src/` (CRA boilerplate)

Start the dev server (hot reload):

```bash
npm start
```

Open the URL printed by CRA (usually http://localhost:3000). The frontend UI includes a file upload page.

Backend (Express)
------------------

Location: `server/index.js`

Start the backend server (serves API and uploaded files):

```bash
npm run start:server
```

Default: http://localhost:4000

Useful API endpoints
- POST /upload        — multipart/form-data (field name: `file`) to upload a file
- GET  /files         — JSON array of uploaded file metadata
- GET  /files/:id     — metadata for a specific file
- DELETE /files/:id   — delete a file and its metadata
- GET  /uploads/:name — serve raw file contents

Dev workflow (run both servers)
--------------------------------

Start backend in one terminal and frontend in another. Example:

Terminal 1 (backend):
```bash
npm run start:server
```

Terminal 2 (frontend):
```bash
npm start
```

Notes & Git
-----------
- `server/uploads/` and `server/metadata.json` are ignored from git to avoid committing runtime data (see `.gitignore`).
- The repo is available at: https://github.com/hrshitwill/cloudnest-app

If you want a single-command dev runner (optional), we can add `nodemon` + `concurrently` and a `npm run dev` script so teammates can run both servers with one command.

Troubleshooting
---------------
- If `react-scripts` is missing, run `npm install` and check `package.json` for `react-scripts`.
- If ports are busy, CRA may choose 3001 — use the URL printed in the terminal.
- If delete/upload operations return errors, check the backend terminal for logs and verify the backend is running on port 4000.

License: MIT
