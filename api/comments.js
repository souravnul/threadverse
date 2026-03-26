const pool = require('../lib/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  const { action } = req.query;
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  let user;
  try {
    user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch(err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (action === 'create') {
      const { post_id, parent_id, body } = req.body;
      if (!post_id || !body) return res.status(400).json({ error: 'Missing fields' });

      try {
        const result = await pool.query(
          'INSERT INTO comments (post_id, author_id, parent_id, body) VALUES ($1, $2, $3, $4) RETURNING id',
          [post_id, user.id, parent_id || null, body]
        );
        return res.status(201).json({ id: result.rows[0].id });
      } catch (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  } else if (action === 'vote') {
      const { comment_id, vote } = req.body;
      if (!comment_id || vote === undefined) return res.status(400).json({ error: 'Missing fields' });

      try {
        await pool.query(
          `INSERT INTO comment_votes (comment_id, user_id, vote) VALUES ($1, $2, $3)
           ON CONFLICT (comment_id, user_id) DO UPDATE SET vote = $3`,
          [comment_id, user.id, vote]
        );
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  } else {
      return res.status(400).json({ error: 'Invalid action' });
  }
};
