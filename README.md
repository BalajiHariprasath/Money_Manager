# Money Manager Web Application

A simple and effective web application to manage lending money to friends, track interest, and get notifications for upcoming due dates.

## Features

✅ **User Authentication**
- Simple login and registration system
- Secure password hashing with bcryptjs
- JWT-based session management

✅ **Friend Management**
- Add friends with borrowing details
- Track amount given, interest rate, and due dates
- Store phone numbers and addresses
- Add custom notes for each record

✅ **Money Tracking**
- View total amount lent to all friends
- Calculate interest automatically
- Track total amount with interest included
- Monitor payment status (Active/Cleared)

✅ **Notifications**
- Automatic reminders for upcoming due dates
- Real-time notification system
- Mark notifications as read

✅ **Download & Export**
- Download summary as CSV format
- Download summary as JSON format
- Easy data backup and sharing

✅ **Dashboard**
- Clean, intuitive user interface
- Statistics overview
- Responsive design (works on desktop, tablet, mobile)
- Search and filter functionality

## System Requirements

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- Windows/Mac/Linux operating system

## Installation

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Go to https://nodejs.org/
2. Download the LTS version
3. Install it following the prompts

### Step 2: Navigate to Project Directory
Open Command Prompt/PowerShell and navigate to the Money Manager folder:
```bash
cd "c:\Apps\Hari\Money Manager"
```

### Step 3: Install Dependencies
Run the following command to install all required packages:
```bash
npm install
```

This will install:
- express (web server framework)
- sqlite3 (database)
- bcryptjs (password encryption)
- jsonwebtoken (authentication)
- cors (cross-origin requests)
- dotenv (environment variables)

### Step 4: Start the Server
Run the following command:
```bash
npm start
```

You should see:
```
Money Manager Server running on http://localhost:3000
API endpoints ready. Access the app at http://localhost:3000
```

### Step 5: Access the Application
Open your web browser and go to:
```
http://localhost:3000
```

## Usage Guide

### 1. First Time Setup
1. Go to registration page
2. Create a new account with:
   - Username
   - Email
   - Password (at least 6 characters)
3. Click Register
4. Log in with your credentials

### 2. Adding a Friend Record
1. Click "➕ Add Friend" in the sidebar
2. Fill in the form:
   - **Friend's Name** (required): The name of the friend who borrowed money
   - **Phone Number**: Friend's contact number
   - **Address**: Friend's physical address
   - **Amount Given** (required): How much money you lent
   - **Interest Rate**: Optional interest percentage
   - **Lend Date**: When you gave the money
   - **Due Date** (required): When they should repay
   - **Notes**: Any additional information
3. Click "Add Friend Record"

### 3. Viewing Dashboard Overview
- **Total Lent**: Sum of all amounts given
- **Total Interest**: Sum of all interest amounts
- **Grand Total**: Total lent + total interest
- **Active Records**: Number of ongoing lendings
- **Upcoming Due Dates**: Friends with due dates in next 7 days

### 4. Viewing Friends Records
1. Click "👥 Friends" in the sidebar
2. View all your lending records
3. Use search to find specific friends
4. Filter by status (Active/Cleared)
5. Each card shows:
   - Amount given and total with interest
   - Due date and days remaining
   - Phone, address, and notes
   - Edit and Delete buttons

### 5. Editing Records
1. Click the "✏️ Edit" button on any friend's card
2. Update the information
3. Click "Save Changes"

### 6. Managing Notifications
1. Click "🔔 Notifications" in the sidebar
2. View reminders for upcoming due dates
3. Mark notifications as read
4. Notifications auto-generate 7 days before due date

### 7. Downloading Summary
1. Click "📥 Download Summary" in the sidebar
2. Choose your preferred format:
   - **CSV**: Opens in Excel, easy to share
   - **JSON**: For data backup and integration
3. File will be saved to your Downloads folder

## Database

The application uses **SQLite3** (a file-based database):
- Creates a file: `money-manager.db` in the project folder
- Stores all your users, friends, and transactions
- No external database server needed
- Automatic backup by copying the .db file

## File Structure

```
Money Manager/
├── server.js                 # Main backend server
├── package.json             # Project dependencies
├── .env                     # Configuration file
├── money-manager.db         # Database (created after first run)
└── public/                  # Frontend files
    ├── index.html           # Login/Register page
    ├── dashboard.html       # Main dashboard
    ├── styles.css           # All styling
    ├── auth.js              # Authentication logic
    └── dashboard.js         # Dashboard functionality
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Log in to account

### Friends
- `GET /api/friends` - Get all friends
- `GET /api/friends/:id` - Get specific friend
- `POST /api/friends` - Add new friend
- `PUT /api/friends/:id` - Update friend record
- `DELETE /api/friends/:id` - Delete friend record

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id` - Mark as read

### Data Export
- `GET /api/summary?format=json` - Get summary as JSON
- `GET /api/summary?format=csv` - Get summary as CSV

## Troubleshooting

### Port Already in Use
If you get "Port 3000 already in use" error:
1. Open Command Prompt
2. Run: `netstat -ano | findstr :3000` (Windows)
3. Or use a different port in .env file: `PORT=3001`

### Database Issues
If you get database errors:
1. Close the application
2. Delete `money-manager.db` file
3. Restart the server (it will recreate the database)

### Can't Connect to Server
1. Make sure Node.js is installed: Run `node --version`
2. Make sure you're in the correct directory
3. Check if the server is running (should show the message above)
4. Try: `http://localhost:3000` in browser

### Forgot Password
Currently, there's no password recovery. Create a new account with a different username.

## Tips & Best Practices

1. **Always Update Status**: Mark records as "Cleared" when friend repays
2. **Add Notes**: Use notes for payment methods, partial payments, etc.
3. **Regular Backups**: Copy the `money-manager.db` file periodically
4. **Download Reports**: Export summaries for record keeping
5. **Check Notifications**: Review notifications regularly

## Security Notes

- Change the `JWT_SECRET` in .env file for production use
- Passwords are encrypted using bcryptjs
- Never share your account credentials
- Use strong passwords (at least 8 characters, mix of letters/numbers/symbols)

## Future Enhancements

Planned features:
- PDF export with formatted reports
- Payment history tracking
- Recurring reminders
- SMS notifications
- Mobile app version
- Multi-currency support
- Payment history graph/charts

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Check browser console (F12 > Console tab) for errors
3. Make sure server is running and you're connected to it

## License

This project is open source and free to use.

---

**Happy Money Management! 💰**
