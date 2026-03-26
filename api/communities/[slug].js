const pool = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const slug = req.query.slug || req.params.slug;

  try {
    const commResult = await pool.query(`
      SELECT c.*, u.username as creator 
      FROM communities c
      JOIN users u ON c.created_by = u.id
      WHERE c.slug = $1
    `, [slug]);

    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    const community = commResult.rows[0];

    const postsResult = await pool.query(`
      SELECT p.*, u.username as author 
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.community_id = $1
      ORDER BY p.created_at DESC
    `, [community.id]);

    return res.status(200).json({ community, posts: postsResult.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
