const pool = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const postId = req.query.postId || req.params.postId;

  try {
    const result = await pool.query(`
      SELECT c.*, u.username as author
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
