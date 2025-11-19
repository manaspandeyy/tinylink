require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');

const app = express();
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

const CODE_RE = /^[A-Za-z0-9]{6,8}$/;


app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, version: '1.0' });
});


app.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/links', async (req, res) => {
  const { target_url, code } = req.body || {};
  if (!target_url) return res.status(400).json({ error: 'URL required' });
  if (!validUrl.isWebUri(target_url)) return res.status(400).json({ error: 'Invalid URL' });

  let shortCode = code;
  if (shortCode) {
    if (!CODE_RE.test(shortCode)) return res.status(400).json({ error: 'Invalid code format' });
  } else {
    shortCode = generateRandomCode(6);
  }

  try {
    const q = `INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *`;
    const result = await pool.query(q, [shortCode, target_url]);
    const row = result.rows[0];
    
    
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    const shortUrl = `${baseUrl.replace(/\/$/, '')}/${row.code}`;
    
    res.status(201).json({ ...row, short_url: shortUrl });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/links/:code', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [req.params.code]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/links/:code', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM links WHERE code = $1', [req.params.code]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/:code', async (req, res) => {
  const { code } = req.params;
  if (code === 'favicon.ico') return res.sendStatus(404);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resCheck = await client.query('SELECT id, target_url, clicks FROM links WHERE code = $1 FOR UPDATE', [code]);
    
    if (resCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send('Link not found');
    }

    const link = resCheck.rows[0];
    await client.query('UPDATE links SET clicks = $1, last_clicked = now() WHERE id = $2', [link.clicks + 1, link.id]);
    await client.query('COMMIT');
    
    res.redirect(302, link.target_url);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

function generateRandomCode(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));