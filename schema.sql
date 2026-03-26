-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Communities (subreddits)
CREATE TABLE communities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,         -- e.g. "programming"
  slug VARCHAR(50) UNIQUE NOT NULL,          -- URL-safe: t/programming
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community Memberships
CREATE TABLE memberships (
  user_id INTEGER REFERENCES users(id),
  community_id INTEGER REFERENCES communities(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, community_id)
);

-- Posts (text-only)
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,                        -- No media, text only
  author_id INTEGER REFERENCES users(id),
  community_id INTEGER REFERENCES communities(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments (nested via parent_id)
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  parent_id INTEGER REFERENCES comments(id) DEFAULT NULL,  -- NULL = top-level
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes on Posts
CREATE TABLE post_votes (
  user_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  PRIMARY KEY (user_id, post_id)
);

-- Votes on Comments
CREATE TABLE comment_votes (
  user_id INTEGER REFERENCES users(id),
  comment_id INTEGER REFERENCES comments(id),
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  PRIMARY KEY (user_id, comment_id)
);
