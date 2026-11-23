const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        
  password: '',        
  database: 'toko_pakaian',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/pakaian', async (req, res) => {
  try {
    const { kategori } = req.query;
    let rows;

    if (kategori) {
      const [result] = await pool.query(
        'SELECT * FROM pakaian WHERE kategori = ? ORDER BY id ASC',
        [kategori]
      );
      rows = result;
    } else {
      const [result] = await pool.query(
        'SELECT * FROM pakaian ORDER BY id ASC'
      );
      rows = result;
    }

    res.status(200).json({
      jumlah: rows.length,
      data: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function validasiPakaian(body) {
  const { nama, kategori, ukuran, harga } = body;

  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    return 'Field nama wajib diisi';
  }
  if (!kategori || typeof kategori !== 'string' || kategori.trim() === '') {
    return 'Field kategori wajib diisi';
  }
  if (!ukuran || typeof ukuran !== 'string' || ukuran.trim() === '') {
    return 'Field ukuran wajib diisi';
  }
  if (harga === undefined || !Number.isInteger(harga) || harga < 0) {
    return 'Field harga wajib berupa bilangan bulat >= 0';
  }

  return null; 
}

app.post('/api/pakaian', async (req, res) => {
  const errorMsg = validasiPakaian(req.body);
  if (errorMsg) {
    return res.status(400).json({ error: errorMsg });
  }

  const { nama, kategori, ukuran, harga } = req.body;
  const stok = req.body.stok !== undefined ? req.body.stok : 0;

  try {
    const [hasil] = await pool.query(
      'INSERT INTO pakaian (nama, kategori, ukuran, harga, stok) VALUES (?, ?, ?, ?, ?)',
      [nama.trim(), kategori.trim(), ukuran.trim(), harga, stok]
    );

    const [rows] = await pool.query('SELECT * FROM pakaian WHERE id = ?', [hasil.insertId]);

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pakaian/:id', async (req, res) => {
  const { id } = req.params;

  const errorMsg = validasiPakaian(req.body);
  if (errorMsg) {
    return res.status(400).json({ error: errorMsg });
  }

  const { nama, kategori, ukuran, harga } = req.body;
  const stok = req.body.stok !== undefined ? req.body.stok : 0;

  try {
    const [hasil] = await pool.query(
      'UPDATE pakaian SET nama = ?, kategori = ?, ukuran = ?, harga = ?, stok = ? WHERE id = ?',
      [nama.trim(), kategori.trim(), ukuran.trim(), harga, stok, id]
    );

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ error: 'Pakaian tidak ditemukan' });
    }

    res.status(200).json({
      id: Number(id),
      nama: nama.trim(),
      kategori: kategori.trim(),
      ukuran: ukuran.trim(),
      harga,
      stok
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pakaian/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [hasil] = await pool.query('DELETE FROM pakaian WHERE id = ?', [id]);

    if (hasil.affectedRows === 0) {
      return res.status(404).json({ error: 'Pakaian tidak ditemukan' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});