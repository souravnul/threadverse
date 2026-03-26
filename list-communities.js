require('dotenv').config();
const pool = require('./lib/db');

async function list() {
  const res = await pool.query('SELECT name, slug FROM communities');
  console.log('Communities:', res.rows);
  process.exit();
}

list();
