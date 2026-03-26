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

  const { comment_id, vote } = req.body;
  if (!comment_id || (vote !== 1 && vote !== -1)) return res.status(400).json({ error: 'Invalid vote data' });

  try {
    // Upsert comment vote
    await pool.query(`
      INSERT INTO comment_votes (user_id, comment_id, vote)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, comment_id)
      DO UPDATE SET vote = EXCLUDED.vote
    `, [user.id, comment_id, vote]);

    // Recalculate upvotes and downvotes for the comment
    await pool.query(`
      UPDATE comments
      SET 
        upvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = $1 AND vote = 1),
        downvotes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = $1 AND vote = -1)
      WHERE id = $1
    `, [comment_id]);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
