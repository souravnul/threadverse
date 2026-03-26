// Shared exact error rendering
function showError(msg) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert-error">${msg}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (getToken()) {
        window.location.href = '/';
        return;
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Logging in...';
            
            try {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                const data = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });
                
                setAuth(data.token, data.username);
                window.location.href = '/';
            } catch (err) {
                showError(err.message);
                btn.disabled = false;
                btn.textContent = 'Login';
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Creating account...';
            
            try {
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                const data = await apiFetch('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ username, email, password })
                });
                
                setAuth(data.token, data.username);
                window.location.href = '/';
            } catch (err) {
                showError(err.message);
                btn.disabled = false;
                btn.textContent = 'Sign Up';
            }
        });
    }
});
