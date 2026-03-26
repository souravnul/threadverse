const pool = require('../../lib/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  let user;
  try {
    user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch(err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { post_id, vote } = req.body;
  if (!post_id || vote === undefined) return res.status(400).json({ error: 'Missing fields' });

  try {
    await pool.query(
      `INSERT INTO post_votes (post_id, user_id, vote) VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET vote = $3`,
      [post_id, user.id, vote]
    );
    
    // Update total count
    const result = await pool.query(
      `SELECT SUM(vote) as score FROM post_votes WHERE post_id = $1`,
      [post_id]
    );
    
    const score = result.rows[0].score || 0;
    await pool.query('UPDATE posts SET upvotes = $1 WHERE id = $2', [score, post_id]);
    
    return res.status(200).json({ score });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
