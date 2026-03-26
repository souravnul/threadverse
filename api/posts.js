const pool = require('../lib/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT p.*, u.username as author, c.slug as community_slug, c.name as community_name,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
          FROM posts p
          JOIN users u ON p.author_id = u.id
          JOIN communities c ON p.community_id = c.id
          ORDER BY p.created_at DESC
          LIMIT 100
        `);
        return res.status(200).json(result.rows);
      } catch (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  } else if (req.method === 'POST') {
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
  } else {
      return res.status(405).json({ error: 'Method not allowed' });
  }
};
