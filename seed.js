require('dotenv').config();
const pool = require('./lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    // 1. Create a user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userRes = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET username=EXCLUDED.username RETURNING id',
      ['admin', 'admin@threadverse.com', hashedPassword]
    );
    const userId = userRes.rows[0].id;

    // 2. Create a community
    const communityRes = await pool.query(
      'INSERT INTO communities (name, slug, description, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET slug=EXCLUDED.slug RETURNING id',
      ['General Programming', 'programming', 'A community to discuss programming.', userId]
    );
    const communityId = communityRes.rows[0].id;

    // 3. Join the community
    await pool.query(
      'INSERT INTO memberships (user_id, community_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, communityId]
    );

    // 4. Create a post
    await pool.query(
      'INSERT INTO posts (title, body, author_id, community_id) VALUES ($1, $2, $3, $4)',
      ['Welcome to ThreadVerse!', 'This is the first post on our new serverless discussion platform.', userId, communityId]
    );

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    process.exit();
  }
}

seed();
