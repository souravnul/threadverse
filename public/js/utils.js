function getToken() {
  return localStorage.getItem('token');
}

function getUsername() {
  return localStorage.getItem('username');
}

function setAuth(token, username) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.reload();
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  
  // Try parsing JSON, but handle empty responses
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  
  if (!res.ok) {
      throw new Error(data.error || 'API Error');
  }
  
  return data;
}

// Update Navigation based on Auth
function updateNav() {
    const nav = document.getElementById('nav-links');
    if (!nav) return;
    
    const token = getToken();
    const username = getUsername();
    
    if (token) {
        nav.innerHTML = `
            <a href="/create-post.html">Create Post</a>
            <a href="/create-community.html">Create Community</a>
            <a href="/profile.html?u=${username}">Profile</a>
            <button onclick="logout()" class="btn-link">Logout</button>
        `;
    } else {
        nav.innerHTML = `
            <a href="/login.html">Login</a>
            <a href="/register.html">Register</a>
        `;
    }
}

document.addEventListener('DOMContentLoaded', updateNav);
