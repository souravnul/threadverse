const pool = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.query;

  try {
    // 1. Get user
    const userResult = await pool.query('SELECT id, username, created_at FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];

    // 2. Get user's posts
    const postsResult = await pool.query(`
      SELECT p.*, c.slug as community_slug
      FROM posts p
      JOIN communities c ON p.community_id = c.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
    `, [user.id]);

    // 3. Get user's comments
    const commentsResult = await pool.query(`
      SELECT c.*, p.title as post_title 
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.author_id = $1
      ORDER BY c.created_at DESC
    `, [user.id]);

    return res.status(200).json({
      user,
      posts: postsResult.rows,
      comments: commentsResult.rows
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
