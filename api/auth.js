const pool = require('../lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  const action = req.query.action;
  // console.log(`[API Auth] Action: ${action}`);
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (action === 'register') {
      const { username, email, password } = req.body;
      if (!username || !email || !password)
        return res.status(400).json({ error: 'All fields required' });

      const hash = await bcrypt.hash(password, 10);

      try {
        const result = await pool.query(
          'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
          [username, email, hash]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, username: user.username });
      } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken' });
        return res.status(500).json({ error: 'Server error' });
      }
  } else if (action === 'login') {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });

      try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ token, username: user.username });
      } catch (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  } else {
      return res.status(400).json({ error: 'Invalid action' });
  }
};
