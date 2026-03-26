const pool = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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
};
