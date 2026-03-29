// auth.js - Authentication logic

const API_URL = 'http://localhost:3000/api';

// Tab switching
document.getElementById('loginTab').addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthTab('login');
});

document.getElementById('registerTab').addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthTab('register');
});

function switchAuthTab(tab) {
  document.querySelectorAll('.form-content').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  if (tab === 'login') {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('loginTab').classList.add('active');
  } else {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('registerTab').classList.add('active');
  }
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  if (!username || !password) {
    showError(errorDiv, 'Please enter both username and password');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(errorDiv, data.error || 'Login failed');
      return;
    }

    // Save token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);

    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch (error) {
    showError(errorDiv, 'Connection error. Please try again.');
    console.error('Login error:', error);
  }
});

// Register form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const password2 = document.getElementById('regPassword2').value;
  const errorDiv = document.getElementById('registerError');

  if (!username || !email || !password) {
    showError(errorDiv, 'Please fill in all fields');
    return;
  }

  if (password !== password2) {
    showError(errorDiv, 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError(errorDiv, 'Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(errorDiv, data.error || 'Registration failed');
      return;
    }

    // Clear form and show success
    document.getElementById('registerForm').reset();
    showError(errorDiv, 'Registration successful! Please login.');
    errorDiv.style.background = 'rgba(40, 167, 69, 0.1)';
    errorDiv.style.color = '#28a745';

    // Auto switch to login
    setTimeout(() => switchAuthTab('login'), 1500);
  } catch (error) {
    showError(errorDiv, 'Connection error. Please try again.');
    console.error('Register error:', error);
  }
});

function showError(element, message) {
  element.textContent = message;
  element.style.background = 'rgba(220, 53, 69, 0.1)';
  element.style.color = '#dc3545';
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/dashboard.html';
  }
});
