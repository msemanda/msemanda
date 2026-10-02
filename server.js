require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

/* ── Bootstrap schema on first start ──────────────────── */
async function bootstrap() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS eh_store (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '[]'
    );
  `);
  console.log('✓ Database ready');
}

/* ── Key-Value store API ────────────────────────────────
   GET  /api/store/:key        → returns JSON array/value
   POST /api/store/:key        → sets JSON value
   GET  /api/store             → returns all keys
──────────────────────────────────────────────────────── */
app.get('/api/store', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM eh_store ORDER BY key');
    const result = {};
    rows.forEach(r => { result[r.key] = r.value; });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/store/:key', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT value FROM eh_store WHERE key = $1', [req.params.key]
    );
    res.json(rows.length ? rows[0].value : null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/store/:key', async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO eh_store (key, value) VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [req.params.key, JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/store/:key', async (req, res) => {
  try {
    await pool.query('DELETE FROM eh_store WHERE key = $1', [req.params.key]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Health check ───────────────────────────────────── */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ── Serve index.html for all non-API routes ────────── */
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path), err => {
      if (err) res.sendFile(path.join(__dirname, 'index.html'));
    });
  }
});

bootstrap().then(() => {
  app.listen(PORT, () => console.log(`eHealth running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});
