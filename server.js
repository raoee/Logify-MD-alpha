import path from 'path';
import { fileURLToPath } from 'url';

// Fix for getting directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mariadb from 'mariadb';

// --- CONFIGURATION ---
const DB_CONFIG = {
  host: '192.168.0.98',      // Your Zima Server IP
  user: 'dr_rahul',
  password: 'DoctorPass123', // Your Real Password
  database: 'research_data',
  connectionLimit: 5
};

const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE POOL ---
const pool = mariadb.createPool(DB_CONFIG);

// --- ENDPOINTS ---

app.get('/', (req, res) => res.send('Universal Research Server Online'));

// THE UNIVERSAL SUBMIT ENDPOINT
app.post('/api/submit', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 1. Receive the Universal Payload
    // We expect: { projectId, mrn, formData }
    const { projectId, mrn, formData } = req.body;

    // 2. Validate essential tags
    if (!projectId || !mrn) {
      throw new Error("Missing Project ID or MRN");
    }

    // 3. Convert the form data to a JSON string for storage
    // This allows us to store ANY fields (Hemoglobin, Age, etc.)
    const jsonString = JSON.stringify(formData);

    // 4. Insert into the Universal Table
    const result = await conn.query(`
      INSERT INTO study_records (project_id, patient_mrn, data_payload)
      VALUES (?, ?, ?)
    `, [projectId, mrn, jsonString]);

    console.log(`✅ Saved Record for Project: ${projectId} (MRN: ${mrn})`);
    
    // 5. Send success (Convert BigInt ID to string)
    res.json({ success: true, id: result.insertId.toString() });

  } catch (err) {
    console.error("❌ Save Failed:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// THE DATA RETRIEVAL ENDPOINT
app.get('/api/records/:projectId', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 1. Get all records for this specific project
    const rows = await conn.query(`
      SELECT * FROM study_records 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `, [req.params.projectId]);

    // 2. Process rows to make them safe for the App
    const cleanRows = rows.map(row => ({
      ...row,
      id: row.id.toString(), // Convert BigInt to string
      // MariaDB sometimes returns JSON as text, sometimes as object. We ensure it's an object.
      data_payload: typeof row.data_payload === 'string' ? JSON.parse(row.data_payload) : row.data_payload
    }));

    res.json(cleanRows);

  } catch (err) {
    console.error("❌ Fetch Failed:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// --- START ---
// --- SERVE FRONTEND (Production) ---
// 1. Serve the static files (HTML, CSS, JS) from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// 2. The "Catch-All" Route
// If the user asks for a page (like /dashboard), send them the main index.html
// This lets React handle the routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Universal Server running on http://localhost:${PORT}`);
});