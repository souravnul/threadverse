require('dotenv').config();
const pool = require('./lib/db');

async function purge() {
  try {
    console.log('Purging offensive content...');
    
    // Delete registrations/content related to offensive terms
    // This is a quick fix. In a real app, you'd want moderation tools.
    
    // 1. Delete comments first (references posts and users)
    await pool.query("DELETE FROM comments WHERE body ILIKE '%nazi%' OR body ILIKE '%jew%'");
    
    // 2. Delete posts
    await pool.query("DELETE FROM posts WHERE title ILIKE '%nazi%' OR body ILIKE '%nazi%' OR title ILIKE '%jew%' OR body ILIKE '%jew%'");
    
    // 3. Delete communities
    await pool.query("DELETE FROM communities WHERE name ILIKE '%nazi%' OR slug ILIKE '%nazi%'");
    
    // 4. Delete memberships associated with deleted communities is handled by REFERENCES if cascade is set, 
    // but the schema doesn't show ON DELETE CASCADE for all.
    await pool.query("DELETE FROM memberships WHERE community_id NOT IN (SELECT id FROM communities)");

    console.log('Purge complete.');
  } catch (err) {
    console.error('Error purging database:', err);
  } finally {
    process.exit();
  }
}

purge();
