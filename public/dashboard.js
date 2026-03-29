// dashboard.js - Dashboard functionality

const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentEditingFriendId = null;

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  const username = localStorage.getItem('username');
  document.getElementById('userDisplay').textContent = `👤 ${username}`;

  // Initialize dashboard
  initDashboard();
  setupEventListeners();
  loadOverview();
});

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      switchSection(section);
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Add friend form
  document.getElementById('addFriendForm').addEventListener('submit', addFriend);

  // Edit friend form
  document.getElementById('editFriendForm').addEventListener('submit', updateFriend);

  // Search and filter
  document.getElementById('searchFriend').addEventListener('input', () => {
    setTimeout(loadFriends, 300);
  });

  document.getElementById('filterStatus').addEventListener('change', loadFriends);

  // Download buttons
  document.getElementById('downloadJSON').addEventListener('click', () => downloadSummary('json'));
  document.getElementById('downloadCSV').addEventListener('click', () => downloadSummary('csv'));
  document.getElementById('downloadPDF').addEventListener('click', generatePDF);

  // Modal close
  document.querySelector('.close').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') closeEditModal();
  });

  // Set today's date as default lend date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('lendDate').value = today;
}

function switchSection(section) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === section) {
      item.classList.add('active');
    }
  });

  // Update sections
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
  });

  const sectionElem = document.getElementById(section);
  if (sectionElem) {
    sectionElem.classList.add('active');

    // Load data for specific sections
    if (section === 'overview') loadOverview();
    else if (section === 'friends') loadFriends();
    else if (section === 'add-friend') resetAddFriendForm();
    else if (section === 'notifications') loadNotifications();
  }
}

async function loadOverview() {
  try {
    const response = await fetch(`${API_URL}/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) handleAuthError();

    const friends = await response.json();

    // Calculate totals
    let totalLent = 0;
    let totalInterest = 0;
    const today = new Date();
    const upcomingDues = [];

    friends.forEach(f => {
      if (f.status === 'Active') {
        totalLent += f.amount;
        totalInterest += f.interestAmount;

        const dueDate = new Date(f.dueDate);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 7 && daysUntil > 0) {
          upcomingDues.push({ ...f, daysUntil });
        }
      }
    });

    // Update stats (INR)
    document.getElementById('totalLent').textContent = `₹${totalLent.toFixed(2)}`;
    document.getElementById('totalInterest').textContent = `₹${totalInterest.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `₹${(totalLent + totalInterest).toFixed(2)}`;
    document.getElementById('activeRecords').textContent = friends.filter(f => f.status === 'Active').length;

    // Load upcoming dues
    loadUpcomingDues(upcomingDues);
  } catch (error) {
    console.error('Error loading overview:', error);
  }
}

function loadUpcomingDues(dues) {
  const container = document.getElementById('upcomingDues');

  if (dues.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-text">No upcoming due dates in the next 7 days</div>
      </div>
    `;
    return;
  }

  container.innerHTML = dues.map(d => `
    <div class="record-card">
      <div class="record-header">
        <div class="record-name">${d.name}</div>
        <div style="color: var(--warning-color); font-weight: bold;">⏰ ${d.daysUntil} days left</div>
      </div>
      <div class="record-details">
        <div class="detail-item">
          <div class="detail-label">Amount Due</div>
          <div class="detail-value">₹${d.totalAmount.toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Due Date</div>
          <div class="detail-value">${new Date(d.dueDate).toLocaleDateString()}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Phone</div>
          <div class="detail-value">${d.phoneNumber || 'N/A'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadFriends() {
  try {
    const response = await fetch(`${API_URL}/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) handleAuthError();

    let friends = await response.json();

    // Apply filters
    const search = document.getElementById('searchFriend').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;

    friends = friends.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search) || f.phoneNumber?.toLowerCase().includes(search);
      const matchStatus = !statusFilter || f.status === statusFilter;
      return matchSearch && matchStatus;
    });

    const container = document.getElementById('friendsList');

    if (friends.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">No friends found. Add your first record!</div>
          <button class="btn btn-primary" onclick="switchSection('add-friend')" style="width: auto;">Add Friend</button>
        </div>
      `;
      return;
    }

    container.innerHTML = friends.map(friend => {
      const dueDate = new Date(friend.dueDate);
      const today = new Date();
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      return `
        <div class="record-card">
          <div class="record-header">
            <div class="record-name">${friend.name}</div>
            <span class="record-status status-${friend.status.toLowerCase()}">${friend.status}</span>
          </div>
          <div class="record-details">
            <div class="detail-item">
              <div class="detail-label">Amount Given</div>
              <div class="detail-value">₹${friend.amount.toFixed(2)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Interest (INR)</div>
              <div class="detail-value">₹${friend.interestAmount.toFixed(2)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Total Amount</div>
              <div class="detail-value" style="color: var(--primary-color);">₹${friend.totalAmount.toFixed(2)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${friend.phoneNumber || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Due Date</div>
              <div class="detail-value">${dueDate.toLocaleDateString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Days Remaining</div>
              <div class="detail-value" style="color: ${daysUntil <= 0 ? 'var(--danger-color)' : daysUntil <= 3 ? 'var(--warning-color)' : 'var(--success-color)'};">
                ${daysUntil <= 0 ? 'Overdue' : daysUntil + ' days'}
              </div>
            </div>
          </div>
          <div class="record-details" style="margin-bottom: 0; font-size: 13px;">
            <div class="detail-item">
              <div class="detail-label">Address</div>
              <div class="detail-value">${friend.address || 'Not provided'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Notes</div>
              <div class="detail-value">${friend.notes || 'None'}</div>
            </div>
          </div>
          <div class="record-actions">
            <button class="btn btn-warning" onclick="editFriend(${friend.id})">✏️ Edit</button>
            <button class="btn btn-danger" onclick="deleteFriend(${friend.id})">🗑️ Delete</button>
            <button class="btn btn-secondary" onclick="downloadFriendSummary(${friend.id}, 'csv')">📥 Download Friend CSV</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading friends:', error);
  }
}

async function addFriend(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('friendName').value.trim(),
    phoneNumber: document.getElementById('friendPhone').value.trim(),
    address: document.getElementById('friendAddress').value.trim(),
    amount: parseFloat(document.getElementById('amountGiven').value),
    interestAmount: parseFloat(document.getElementById('interestAmount').value) || 0,
    lendDate: document.getElementById('lendDate').value,
    dueDate: document.getElementById('dueDate').value,
    notes: document.getElementById('friendNotes').value.trim()
  };

  const errorDiv = document.getElementById('addFriendError');

  if (!formData.name || !formData.amount || !formData.dueDate) {
    errorDiv.textContent = 'Please fill in all required fields';
    return;
  }

  if (formData.amount <= 0) {
    errorDiv.textContent = 'Amount must be greater than 0';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/friends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || 'Error adding friend';
      return;
    }

    // Clear form and show success
    document.getElementById('addFriendForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lendDate').value = today;
    errorDiv.textContent = '';

    // Switch to friends view
    switchSection('friends');
    setTimeout(loadFriends, 500);
  } catch (error) {
    errorDiv.textContent = 'Connection error. Please try again.';
    console.error('Error adding friend:', error);
  }
}

function resetAddFriendForm() {
  document.getElementById('addFriendForm').reset();
  document.getElementById('addFriendError').textContent = '';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('lendDate').value = today;
}

async function editFriend(friendId) {
  try {
    const response = await fetch(`${API_URL}/friends/${friendId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) handleAuthError();

    const friend = await response.json();

    currentEditingFriendId = friendId;

    // Fill form with friend data
    document.getElementById('editFriendId').value = friendId;
    document.getElementById('editFriendName').value = friend.name;
    document.getElementById('editFriendPhone').value = friend.phoneNumber || '';
    document.getElementById('editFriendAddress').value = friend.address || '';
    document.getElementById('editAmountGiven').value = friend.amount;
    document.getElementById('editInterestAmount').value = friend.interestAmount || 0;
    document.getElementById('editDueDate').value = friend.dueDate.split('T')[0];
    document.getElementById('editStatus').value = friend.status;
    document.getElementById('editFriendNotes').value = friend.notes || '';
    if (friend.aadharUrl) {
      document.getElementById('aadharStatus').innerHTML = `Aadhaar uploaded: <a href="${friend.aadharUrl}" target="_blank">View</a>`;
    } else {
      document.getElementById('aadharStatus').textContent = 'No Aadhaar uploaded';
    }
    document.getElementById('editError').textContent = '';

    // Show modal
    document.getElementById('editModal').classList.add('active');
  } catch (error) {
    console.error('Error loading friend for edit:', error);
  }
}

async function updateFriend(e) {
  e.preventDefault();

  const friendId = document.getElementById('editFriendId').value;
  const formData = {
    name: document.getElementById('editFriendName').value.trim(),
    phoneNumber: document.getElementById('editFriendPhone').value.trim(),
    address: document.getElementById('editFriendAddress').value.trim(),
    amount: parseFloat(document.getElementById('editAmountGiven').value),
    interestAmount: parseFloat(document.getElementById('editInterestAmount').value) || 0,
    dueDate: document.getElementById('editDueDate').value,
    status: document.getElementById('editStatus').value,
    notes: document.getElementById('editFriendNotes').value.trim()
  };

  const errorDiv = document.getElementById('editError');

  if (!formData.name || !formData.amount || !formData.dueDate) {
    errorDiv.textContent = 'Please fill in all required fields';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/friends/${friendId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || 'Error updating friend';
      return;
    }

    closeEditModal();
    loadFriends();
  } catch (error) {
    document.getElementById('editError').textContent = 'Connection error. Please try again.';
    console.error('Error updating friend:', error);
  }
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  currentEditingFriendId = null;
}

async function deleteFriend(friendId) {
  if (!confirm('Are you sure you want to delete this record?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/friends/${friendId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) handleAuthError();

    loadFriends();
  } catch (error) {
    console.error('Error deleting friend:', error);
    alert('Error deleting record. Please try again.');
  }
}

async function loadNotifications() {
  try {
    const response = await fetch(`${API_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) handleAuthError();

    const notifications = await response.json();
    const container = document.getElementById('notificationsList');

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <div class="empty-state-text">No notifications at the moment</div>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications.map(n => `
      <div class="notification ${n.isRead ? 'read' : ''}">
        <div class="notification-content">
          <div class="notification-message">${n.message}</div>
          <div class="notification-time">${new Date(n.createdAt).toLocaleString()}</div>
        </div>
        ${!n.isRead ? `<div class="notification-action"><button class="btn btn-small btn-primary" onclick="markAsRead(${n.id})">Mark as Read</button></div>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

async function markAsRead(notificationId) {
  try {
    await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    loadNotifications();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function downloadSummary(format) {
  try {
    const response = await fetch(`${API_URL}/summary?format=${format}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) handleAuthError();

    if (format === 'csv') {
      const csv = await response.text();
      downloadFile(csv, 'money-manager-summary.csv', 'text/csv');
    } else {
      const json = await response.json();
      const jsonString = JSON.stringify(json, null, 2);
      downloadFile(jsonString, 'money-manager-summary.json', 'application/json');
    }
  } catch (error) {
    console.error('Error downloading summary:', error);
    alert('Error downloading summary. Please try again.');
  }
}

function downloadFriendSummary(friendId, format = 'csv') {
  fetch(`${API_URL}/friends/${friendId}/summary?format=${format}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(async response => {
      if (!response.ok) return handleAuthError();

      if (format === 'csv') {
        const csv = await response.text();
        downloadFile(csv, `friend-${friendId}-summary.csv`, 'text/csv');
      } else {
        const json = await response.json();
        downloadFile(JSON.stringify(json, null, 2), `friend-${friendId}-summary.json`, 'application/json');
      }
    })
    .catch(err => {
      console.error('Error downloading friend summary:', err);
      alert('Error downloading the friend summary.');
    });
}

async function uploadAadhar() {
  const friendId = document.getElementById('editFriendId').value;
  const fileInput = document.getElementById('editAadharUpload');
  const statusElem = document.getElementById('aadharStatus');

  if (!friendId) return;
  if (!fileInput.files || !fileInput.files[0]) {
    statusElem.textContent = 'Please select a file first.';
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function () {
    const dataUrl = reader.result;
    const base64 = dataUrl.split(',')[1];

    try {
      const response = await fetch(`${API_URL}/friends/${friendId}/aadhar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileName: file.name, contentBase64: base64 })
      });

      const result = await response.json();
      if (!response.ok) {
        statusElem.textContent = result.error || 'Aadhaar upload failed.';
        return;
      }

      statusElem.innerHTML = `Aadhaar uploaded. <a href="${result.aadharUrl}" target="_blank">Open File</a>`;
      fileInput.value = '';
      loadFriends();
    } catch (error) {
      console.error('Error uploading Aadhaar:', error);
      statusElem.textContent = 'Upload failed. Try again.';
    }
  };

  reader.readAsDataURL(file);
}

function generatePDF() {
  alert('PDF download will be available soon. For now, you can download as CSV or JSON.');
}

function downloadFile(content, filename, type) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:' + type + ';charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function initDashboard() {
  switchSection('overview');
  setInterval(loadNotifications, 60000); // Check notifications every minute
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  window.location.href = '/index.html';
}

function handleAuthError() {
  alert('Session expired. Please login again.');
  logout();
}
