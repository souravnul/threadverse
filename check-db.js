require('dotenv').config();
const pool = require('./lib/db');

console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'UNDEFINED');

console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'UNDEFINED');

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error checking tables:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
