# Money Manager - Recent Enhancements

## ✅ All Features Implemented

### 1. **Currency: Changed to INR (Indian Rupees)**
- All monetary displays now use `₹` symbol instead of `$`
- Amount fields labeled explicitly as "(INR)"
- Total calculation and display in INR

### 2. **Interest as Rupees (Amount) - Not Percentage**
- New field: **Interest Amount (INR)** - enter direct rupee amount
- Old percentage-based interest still supported for backwards compatibility
- When adding/editing friends: specify actual interest rupees to charge
- Auto-calculates total: Amount + Interest Amount

### 3. **Daily Notifications**
- Check runs once daily (24-hour interval)
- Notifications for:
  - **Upcoming dues**: Triggers 7 days before due date
  - **Overdue payments**: Generated and tracked when past due date
  - Both notification types show days remaining/overdue
- Access in: **Notifications** section of dashboard

### 4. **Edit Friend Details**
- Click **Edit button** on any friend card in Friends section
- Modal opens with all editable fields:
  - Name, phone, address
  - Amount given, interest amount
  - Due date, status, notes
- Changes save to database immediately

### 5. **Download Summary for Each Friend**
- New **Download Friend CSV** button on each friend card
- Downloads individual friend's record with:
  - All lending details
  - Interest amount in INR
  - Loan dates and status
- Filename format: `friend-{id}-summary.csv`

### 6. **Aadhaar Card Upload**
- Upload in the **Edit Friend** modal
- Accepts: PDF, JPG, PNG formats
- Upload button processes file and stores securely
- Shows uploaded file link for verification
- Files stored in `/uploads/` directory with secure naming

### 7. **Complete Record Maintenance**
- **Database enhancements**:
  - New field: `interestAmount` (actual rupees, not %)
  - New field: `aadharCardPath` (Aadhaar file storage)
  - Database auto-migrates on startup
- **Records tracked**:
  - All lending history maintained
  - Complete friend details stored
  - Aadhaar documents linked to each friend
  - Notifications and due dates tracked
  - Payment status (Active/Cleared)

## 📱 UI Features

### Dashboard Overview
- Shows total lent (INR), total interest (INR), grand total (INR)
- Upcoming due dates alert (7-day window)
- Active records count

### Friends Section
- Search by name/phone
- Filter by status (Active/Cleared)
- Each card shows all details in INR
- Edit, Delete, Download buttons per friend

### Add Friend
- Simple form entry with INR fields
- Interest as direct amount (rupees)
- Automatic today's date as lend date

### Notifications
- Daily check for due/overdue payments
- Mark as read functionality
- Shows days remaining or overdue

### Summary Download
- Overall JSON/CSV export of all records
- Individual friend CSV exports
- All amounts in INR
- Includes Aadhaar upload status

## 🔧 API Endpoints Added/Updated

```
POST /api/friends/                    - Add friend (with interestAmount)
GET /api/friends                      - Get all friends (INR converted)
GET /api/friends/:id                  - Get single friend
PUT /api/friends/:id                  - Update friend (with interestAmount)
DELETE /api/friends/:id               - Delete friend
GET /api/friends/:id/summary          - Download individual friend summary
POST /api/friends/:id/aadhar          - Upload Aadhaar for friend
GET /api/friends/:id/aadhar           - Get Aadhaar URL for friend
GET /api/notifications                - Get daily notifications
PUT /api/notifications/:id            - Mark notification as read
GET /api/summary                      - Download all records summary
```

## 📁 File Changes

### Backend (server.js)
- Added `fs` module for file handling
- Added `migrateFriendsTable()` for schema evolution
- Updated `/friends` POST/PUT endpoints for `interestAmount`
- New endpoints: `GET /friends/:id/summary`, `POST /friends/:id/aadhar`
- Daily notification generation (24-hour cycle)
- Static upload directory `/uploads` for Aadhaar files
- Fixed summary to use actual interest amounts (INR)

### Frontend (dashboard.html)
- Changed "Interest Rate" to "Interest Amount (INR)" in all forms
- Added Aadhaar file upload input in edit modal
- Updated all currency symbols from $ to ₹
- Added Aadhaar upload status display

### Frontend (dashboard.js)
- Updated all currency displays to INR (₹)
- Changed form data submission to use `interestAmount` instead of `interestRate`
- Added `uploadAadhar()` function for file uploads
- Added `downloadFriendSummary()` for individual exports
- Enhanced edit modal to show Aadhaar upload status
- Daily notification auto-load

## 🚀 How to Use

1. **Add a Friend**
   - Specify amount and interest in rupees
   - Set due date for payment reminder

2. **Edit Anytime**
   - Click Edit on any friend card
   - Update all details as needed
   - Upload/reupload Aadhaar if needed

3. **Get Notifications**
   - Check Notifications tab daily
   - System alerts for upcoming/overdue payments

4. **Download Records**
   - Individual: Button on each friend card (CSV)
   - All: Download Summary section (JSON/CSV)
   - Include Aadhaar status in exports

5. **Maintain Records**
   - Mark cleared payments as "Cleared" status
   - Keep Aadhaar cards uploaded for verification
   - Track all transaction history

## 💾 Database Auto-Migration

Server automatically:
- Adds `interestAmount` column if missing
- Adds `aadharCardPath` column if missing
- Calculates historical interest amounts from percentages
- Ensures backward compatibility with existing data

**No manual database updates needed!** Just run the server and it handles all schema changes.
