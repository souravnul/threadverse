const pool = require('../../lib/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  let user;
  try {
    const token = authHeader.split(' ')[1];
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch(err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { title, body, community_id } = req.body;
  if (!title || !body || !community_id) return res.status(400).json({ error: 'Missing fields' });

  try {
    const result = await pool.query(
      'INSERT INTO posts (title, body, author_id, community_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, body, user.id, community_id]
    );
    return res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
