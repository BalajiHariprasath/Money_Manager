# Quick Start Guide - Money Manager

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
Open Command Prompt in the Money Manager folder and run:
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

### Step 3: Open in Browser
Go to: `http://localhost:3000`

---

## 📝 First Time Use

1. **Register**: Click "Register" and create an account
2. **Add Friends**: Click "➕ Add Friend" and enter lending details
3. **Track**: View dashboard to see all your lendings
4. **Download**: Export your data as CSV or JSON

---

## 🎯 Key Features at a Glance

| Feature | How to Use |
|---------|-----------|
| **Add Friend** | Sidebar → "➕ Add Friend" |
| **View All** | Sidebar → "👥 Friends" |
| **Dashboard** | Sidebar → "📊 Overview" |
| **Notifications** | Sidebar → "🔔 Notifications" |
| **Download** | Sidebar → "📥 Download Summary" |
| **Logout** | Bottom of sidebar → "Logout" |

---

## 💡 Tips

- Set reminder dates 7 days before actual due date
- Use "Interest Rate" to track annual return
- Update status to "Cleared" when money is returned
- Download summaries for record keeping
- Add phone numbers to quickly contact friends

---

## ⚙️ Troubleshooting

**Server won't start?**
- Make sure Node.js is installed: `node --version`
- Try a different port: Edit `.env` file, change `PORT=3000` to `PORT=3001`

**Can't login?**
- Make sure you registered first
- Check username and password are correct

**Want to reset?**
- Delete `money-manager.db` file
- Restart server
- Data will be fresh

---

Enjoy managing your money! 💰
