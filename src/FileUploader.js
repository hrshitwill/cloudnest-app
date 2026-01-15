import React, { useState, useEffect } from 'react';
import './FileUploader.css';

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // When developing locally, talk directly to backend to avoid proxy hiccups.
  const BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  useEffect(() => {
    fetchFiles();
  }, []);

  function fetchFiles() {
    setLoading(true);
    fetch(BASE + '/files')
      .then(r => r.json())
      .then(data => setFiles(data))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }

  function deleteFile(id) {
    if (!confirm('Delete this file? This action cannot be undone.')) return;
    fetch(BASE + '/files/' + id, { method: 'DELETE' })
      .then(r => {
        if (!r.ok) throw new Error('Delete failed');
        // refresh list
        fetchFiles();
      })
      .catch(err => alert('Delete failed: ' + (err.message || err)));
  }

  function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert('Please pick a file');

    const fd = new FormData();
    fd.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', BASE + '/upload');
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setFile(null);
        setProgress(0);
        fetchFiles();
      } else {
        alert('Upload failed: ' + xhr.responseText);
      }
    };
    xhr.onerror = () => alert('Upload error');
    xhr.send(fd);
  }

  return (
    <div className="uploader">
      <h2>Upload a file</h2>
      <form onSubmit={handleUpload} className="uploader-form">
        <div className="controls">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <button type="submit" disabled={!file}>Upload</button>
        </div>
        {progress > 0 && <div className="progress">{progress}%</div>}
      </form>

      <h3>Uploaded files</h3>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : files.length === 0 ? (
        <div className="empty">No files uploaded yet.</div>
      ) : (
        <ul className="files-list">
          {files.map(f => (
            <li key={f.id} className="file-item">
              <div className="file-main">
                <div className="file-info">
                  <a className="file-link" href={BASE + f.path} target="_blank" rel="noreferrer">{f.originalname}</a>
                  <div className="meta">{Math.round(f.size / 1024)} KB — {new Date(f.uploadedAt).toLocaleString()}</div>
                </div>
                <div className="file-actions">
                  <a className="btn small" href={BASE + f.path} target="_blank" rel="noreferrer">Download</a>
                  <button className="btn danger small" onClick={() => deleteFile(f.id)}>Delete</button>
                </div>
              </div>
              {f.metadata && Object.keys(f.metadata).length > 0 && (
                <pre className="meta-json">{JSON.stringify(f.metadata, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
