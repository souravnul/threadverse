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

  const { post_id, vote } = req.body;
  if (!post_id || (vote !== 1 && vote !== -1)) return res.status(400).json({ error: 'Invalid vote data' });

  try {
    // Upsert vote
    await pool.query(`
      INSERT INTO post_votes (user_id, post_id, vote)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, post_id)
      DO UPDATE SET vote = EXCLUDED.vote
    `, [user.id, post_id, vote]);

    // Recalculate upvotes and downvotes for the post
    await pool.query(`
      UPDATE posts
      SET 
        upvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = $1 AND vote = 1),
        downvotes = (SELECT COUNT(*) FROM post_votes WHERE post_id = $1 AND vote = -1)
      WHERE id = $1
    `, [post_id]);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
