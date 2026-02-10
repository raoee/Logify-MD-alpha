import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure Environment Variables
dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'dist')));

// 2. DATABASE CONFIGURATION
const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.0.98',
  user: process.env.DB_USER || 'dr_rahul',
  password: process.env.DB_PASSWORD || 'DoctorPass123',
  database: process.env.DB_NAME || 'research_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 3. API ROUTES

// --- Test Route ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy!' });
});

// --- Login Route ---
app.post('/api/login', async (req, res) => {
  let conn;
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);

    conn = await pool.getConnection();
    
    // Check credentials
    const [rows] = await conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

    if (rows.length > 0) {
      res.json({ success: true, user: { username: rows[0].username, role: rows[0].role || 'admin' } });
    } else {
      res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, error: 'Database Error' });
  } finally {
    if (conn) conn.release();
  }
});

// --- Submit Data Route ---
app.post('/api/submit', async (req, res) => {
  let conn;
  try {
    const { projectId, mrn, formData } = req.body;
    conn = await pool.getConnection();
    
    // Save to the records table (Ensure this table exists in your DB!)
    const [result] = await conn.query(
      'INSERT INTO records (project_id, data_payload) VALUES (?, ?)',
      [projectId, JSON.stringify(formData)] // We store the whole form as JSON
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Submit Error:', err);
    res.status(500).json({ success: false, error: 'Database Error' });
  } finally {
    if (conn) conn.release();
  }
});

// --- Get Records Route ---
app.get('/api/records/:projectId', async (req, res) => {
  let conn;
  try {
    const { projectId } = req.params;
    conn = await pool.getConnection();
    
    const [rows] = await conn.query(
      'SELECT id, project_id, data_payload, created_at FROM records WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    // Parse the JSON back to objects
    const parsedRows = rows.map(row => ({
      ...row,
      data_payload: typeof row.data_payload === 'string' ? JSON.parse(row.data_payload) : row.data_payload
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ error: 'Database Error' });
  } finally {
    if (conn) conn.release();
  }
});

// 4. WILDCARD (Must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 5. START
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
});