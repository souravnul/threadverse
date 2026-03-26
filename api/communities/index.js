const pool = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await pool.query(`
      SELECT c.*, u.username as creator
      FROM communities c
      JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
