const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Database setup
const db = new sqlite3.Database('./money-manager.db', (err) => {
  if (err) console.log('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static('public'));

// Serve uploaded Aadhaar files
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phoneNumber TEXT,
      address TEXT,
      amount REAL NOT NULL,
      interestRate REAL DEFAULT 0,
      lendDate DATETIME NOT NULL,
      dueDate DATETIME NOT NULL,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      friendId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      type TEXT,
      amount REAL NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      FOREIGN KEY (friendId) REFERENCES friends(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      friendId INTEGER NOT NULL,
      friendName TEXT NOT NULL,
      message TEXT NOT NULL,
      daysUntilDue INTEGER,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (friendId) REFERENCES friends(id)
    )
  `);
}

initializeDatabase();

// Add missing columns from schema evolution
async function migrateFriendsTable() {
  const cols = await dbAll("PRAGMA table_info('friends')");
  const colNames = cols.map(c => c.name);

  if (!colNames.includes('interestAmount')) {
    await dbRun('ALTER TABLE friends ADD COLUMN interestAmount REAL DEFAULT 0');
  }

  if (!colNames.includes('aadharCardPath')) {
    await dbRun('ALTER TABLE friends ADD COLUMN aadharCardPath TEXT');
  }

  // For backward compatibility set interestAmount from interestRate if not already set
  if (colNames.includes('interestRate')) {
    const rows = await dbAll('SELECT id, amount, interestRate, interestAmount FROM friends');
    for (let row of rows) {
      if ((row.interestAmount === null || row.interestAmount === 0) && row.interestRate) {
        const computed = (row.amount || 0) * (row.interestRate || 0) / 100;
        await dbRun('UPDATE friends SET interestAmount = ? WHERE id = ?', [computed, row.id]);
      }
    }
  }
}

migrateFriendsTable().catch(err => console.error('Migration error:', err));

// Helper function to run/get database queries
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes

// 1. User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );

    res.json({ message: 'User registered successfully', userId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({ token, userId: user.id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Add Friend (Add lending record)
app.post('/api/friends', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber, address, amount, interestAmount, interestRate, lendDate, dueDate, notes } = req.body;

    if (!name || !amount || !dueDate) {
      return res.status(400).json({ error: 'Name, amount, and due date required' });
    }

    const interest = (interestAmount != null && !isNaN(interestAmount))
      ? parseFloat(interestAmount)
      : ((amount || 0) * ((interestRate || 0) / 100));

    const result = await dbRun(
      `INSERT INTO friends (userId, name, phoneNumber, address, amount, interestRate, interestAmount, lendDate, dueDate, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, phoneNumber, address, amount, interestRate || 0, interest, lendDate, dueDate, notes]
    );

    res.json({ message: 'Friend record added successfully', friendId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get all friends for user
app.get('/api/friends', authenticateToken, async (req, res) => {
  try {
    const friends = await dbAll(
      `SELECT * FROM friends WHERE userId = ? ORDER BY dueDate ASC`,
      [req.user.id]
    );

    // Calculate available fields and total based on interest rupees
    const friendsWithInterest = friends.map(friend => {
      const interestAmount = friend.interestAmount != null ? friend.interestAmount : (friend.amount * (friend.interestRate || 0) / 100);
      return {
        ...friend,
        interestAmount,
        totalAmount: friend.amount + interestAmount,
        aadharUrl: friend.aadharCardPath ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(friend.aadharCardPath)}` : null
      };
    });

    res.json(friendsWithInterest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get specific friend
app.get('/api/friends/:id', authenticateToken, async (req, res) => {
  try {
    const friend = await dbGet(
      'SELECT * FROM friends WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    if (!friend) return res.status(404).json({ error: 'Friend not found' });

    const interestAmount = friend.interestAmount != null ? friend.interestAmount : (friend.amount * (friend.interestRate || 0) / 100);
    friend.interestAmount = interestAmount;
    friend.totalAmount = friend.amount + interestAmount;
    friend.aadharUrl = friend.aadharCardPath ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(friend.aadharCardPath)}` : null;

    res.json(friend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5b. Get single friend summary
app.get('/api/friends/:id/summary', authenticateToken, async (req, res) => {
  try {
    const friend = await dbGet('SELECT * FROM friends WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!friend) return res.status(404).json({ error: 'Friend not found' });

    const interestAmount = friend.interestAmount != null ? friend.interestAmount : (friend.amount * (friend.interestRate || 0) / 100);
    const totalAmount = friend.amount + interestAmount;

    const summary = {
      generatedAt: new Date().toISOString(),
      friend: {
        id: friend.id,
        name: friend.name,
        phone: friend.phoneNumber,
        address: friend.address,
        amountGiven: friend.amount,
        interestAmount,
        totalAmount,
        lendDate: friend.lendDate,
        dueDate: friend.dueDate,
        status: friend.status,
        notes: friend.notes,
        aadharUrl: friend.aadharCardPath ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(friend.aadharCardPath)}` : null
      }
    };

    const format = req.query.format || 'json';
    if (format === 'csv') {
      const csv = `Name,Phone,Address,Amount Given,Interest Amount,Total Amount,Lend Date,Due Date,Status,Notes\n` +
        `"${friend.name}","${friend.phoneNumber || ''}","${friend.address || ''}",${friend.amount},${interestAmount},${totalAmount},"${friend.lendDate}","${friend.dueDate}","${friend.status}","${friend.notes || ''}"\n`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=friend-${friend.id}-summary.csv`);
      return res.send(csv);
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5c. Upload Aadhaar card for friend
app.post('/api/friends/:id/aadhar', authenticateToken, async (req, res) => {
  try {
    const { fileName, contentBase64 } = req.body;
    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'File name and content required' });
    }

    const friend = await dbGet('SELECT * FROM friends WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!friend) return res.status(404).json({ error: 'Friend not found' });

    const safeName = path.basename(fileName);
    const filePath = path.join(__dirname, 'uploads', `${req.user.id}-${req.params.id}-${Date.now()}-${safeName}`);
    const buffer = Buffer.from(contentBase64, 'base64');

    await fs.promises.writeFile(filePath, buffer);
    await dbRun('UPDATE friends SET aadharCardPath = ? WHERE id = ? AND userId = ?', [filePath, req.params.id, req.user.id]);

    const aadharUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(filePath)}`;
    res.json({ message: 'Aadhaar uploaded successfully', aadharUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5d. Get Aadhaar URL
app.get('/api/friends/:id/aadhar', authenticateToken, async (req, res) => {
  try {
    const friend = await dbGet('SELECT aadharCardPath FROM friends WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!friend) return res.status(404).json({ error: 'Friend not found' });

    if (!friend.aadharCardPath) return res.status(404).json({ error: 'Aadhaar not uploaded yet' });

    res.json({ aadharUrl: `${req.protocol}://${req.get('host')}/uploads/${path.basename(friend.aadharCardPath)}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Update friend record
app.put('/api/friends/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber, address, amount, interestAmount, interestRate, dueDate, status, notes } = req.body;
    const interest = (interestAmount != null && !isNaN(interestAmount))
      ? parseFloat(interestAmount)
      : ((amount || 0) * ((interestRate || 0) / 100));

    const result = await dbRun(
      `UPDATE friends SET name = ?, phoneNumber = ?, address = ?, amount = ?, interestRate = ?, interestAmount = ?, dueDate = ?, status = ?, notes = ?
       WHERE id = ? AND userId = ?`,
      [name, phoneNumber, address, amount, interestRate || 0, interest, dueDate, status, notes, req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Friend record not found' });
    }

    res.json({ message: 'Friend record updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Delete friend record
app.delete('/api/friends/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbRun(
      'DELETE FROM friends WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Friend record not found' });
    }

    res.json({ message: 'Friend record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Generate notifications for due dates
async function generateNotifications() {
  const today = new Date();

  try {
    const friends = await dbAll(`
      SELECT f.*, u.id as userId FROM friends f
      JOIN users u ON f.userId = u.id
      WHERE f.status = 'Active' AND f.dueDate IS NOT NULL
    `);

    for (let friend of friends) {
      const dueDate = new Date(friend.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        const existingNotif = await dbGet(
          'SELECT * FROM notifications WHERE friendId = ? AND daysUntilDue = ? AND message = ?',
          [friend.id, daysUntilDue, `Payment due in ${daysUntilDue} day(s) from ${friend.name}`]
        );

        if (!existingNotif) {
          await dbRun(
            `INSERT INTO notifications (userId, friendId, friendName, message, daysUntilDue)
             VALUES (?, ?, ?, ?, ?)`,
            [friend.userId, friend.id, friend.name, `Payment due in ${daysUntilDue} day(s) from ${friend.name}`, daysUntilDue]
          );
        }
      }

      if (daysUntilDue < 0) {
        const overdueDays = Math.abs(daysUntilDue);
        const existingOverdue = await dbGet(
          'SELECT * FROM notifications WHERE friendId = ? AND daysUntilDue = ? AND message = ?',
          [friend.id, -overdueDays, `Overdue by ${overdueDays} day(s) for ${friend.name}`]
        );

        if (!existingOverdue) {
          await dbRun(
            `INSERT INTO notifications (userId, friendId, friendName, message, daysUntilDue)
             VALUES (?, ?, ?, ?, ?)`,
            [friend.userId, friend.id, friend.name, `Overdue by ${overdueDays} day(s) for ${friend.name}`, -overdueDays]
          );
        }
      }
    }
  } catch (error) {
    console.log('Error generating notifications:', error);
  }
}

// Start daily notification check (and run immediately)
generateNotifications();
setInterval(generateNotifications, 24 * 60 * 60 * 1000);  // run daily

// 9. Get notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await dbAll(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20',
      [req.user.id]
    );

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Mark notification as read
app.put('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun(
      'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Get summary for download
app.get('/api/summary', authenticateToken, async (req, res) => {
  try {
    const format = req.query.format || 'json'; // json or csv

    const friends = await dbAll(
      'SELECT * FROM friends WHERE userId = ? ORDER BY dueDate ASC',
      [req.user.id]
    );

    const summary = {
      generatedAt: new Date().toISOString(),
      totalRecords: friends.length,
      totalLent: 0,
      totalInterest: 0,
      friends: []
    };

    friends.forEach(friend => {
      const interestAmount = friend.interestAmount != null ? friend.interestAmount : (friend.amount * friend.interestRate / 100);
      summary.totalLent += friend.amount;
      summary.totalInterest += interestAmount;
      summary.friends.push({
        name: friend.name,
        phone: friend.phoneNumber,
        address: friend.address,
        amountGiven: friend.amount,
        interestAmount: interestAmount.toFixed(2),
        totalAmount: (friend.amount + interestAmount).toFixed(2),
        lendDate: friend.lendDate,
        dueDate: friend.dueDate,
        status: friend.status,
        notes: friend.notes,
        aadharUrl: friend.aadharCardPath ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(friend.aadharCardPath)}` : null
      });
    });

    if (format === 'csv') {
      let csv = 'Name,Phone,Address,Amount Given,Interest Rate,Interest Amount,Total Amount,Lend Date,Due Date,Status,Notes\n';
      summary.friends.forEach(f => {
        csv += `"${f.name}","${f.phone}","${f.address}",${f.amountGiven},${f.interestRate},${f.interestAmount},${f.totalAmount},"${f.lendDate}","${f.dueDate}","${f.status}","${f.notes}"\n`;
      });
      csv += `\n\nTotal Lent: ${summary.totalLent.toFixed(2)}\n`;
      csv += `Total Interest: ${summary.totalInterest.toFixed(2)}\n`;
      csv += `Grand Total: ${(summary.totalLent + summary.totalInterest).toFixed(2)}\n`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=money-manager-summary.csv');
      res.send(csv);
    } else {
      res.json(summary);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Money Manager Server running on http://localhost:${PORT}`);
  console.log(`API endpoints ready. Access the app at http://localhost:${PORT}\n`);
});
