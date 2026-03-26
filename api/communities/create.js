const pool = require('../../lib/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch(err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { name, slug, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });

  try {
    const result = await pool.query(
      'INSERT INTO communities (name, slug, description, created_by) VALUES ($1, $2, $3, $4) RETURNING id, slug',
      [name, slug, description, user.id]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Community with this name or slug already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
};
