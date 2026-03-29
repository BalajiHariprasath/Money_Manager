# Deploying Money Manager to Render.com

## ✅ Quick Deployment Steps

### 1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account
   - Grant GitHub access permissions

### 2. **Connect Your GitHub Repository**
   - In Render dashboard, click **"New Web Service"**
   - Select **"Deploy an existing repository"**
   - Connect your GitHub account if not already done
   - Select repository: `Money_Manager`
   - Allow Render to access the repo

### 3. **Configure the Service**
   - **Name**: `money-manager` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: Leave blank (auto-detects from `render.yaml`)
   - **Start Command**: Leave blank (auto-detects from `render.yaml`)
   - **Plan**: Free (or upgrade for better performance)

### 4. **Set Environment Variables**
   Render automatically sets:
   - `JWT_SECRET` - Randomly generated (do NOT change)
   - `NODE_ENV` - Set to `production`
   - `PORT` - Set to `3000`

   Optional environment variables you can add:
   - `JWT_SECRET`: Override with your custom value (recommended for production)

### 5. **Deploy**
   - Click **"Create Web Service"**
   - Render will:
     - Clone your GitHub repo
     - Install dependencies (`npm install`)
     - Start the server (`npm start`)
     - Assign a live URL

### 6. **Access Your App**
   - Render provides a URL like: `https://money-manager-xxxxx.onrender.com`
   - Your app is now live! 🎉

---

## 📌 Important Notes

### Database & File Storage
- **SQLite Database**: Stored in `/tmp/` on Render
- **Aadhaar Uploads**: Also stored in `/tmp/` (ephemeral)
- ⚠️ **Note**: Free tier Render instances can restart, which clears `/tmp/`
- **Solution for Production**: 
  - Upgrade to paid plan for persistent storage, OR
  - Switch to PostgreSQL (Render offers free tier), OR
  - Use cloud storage (S3, Cloudinary) for Aadhaar files

### Free Tier Limitations
- App spins down after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- No persistence across restarts
- Bandwidth: 100 GB/month

### Upgrading to Production
For a production-ready setup with data persistence:
1. Use **Render PostgreSQL** instead of SQLite
2. Store Aadhaar files in **AWS S3** or **Cloudinary**
3. Upgrade to paid plan ($7/month)

---

## 🔄 Continuous Deployment

Any push to your `main` branch on GitHub will automatically:
1. Trigger a new Render build
2. Install dependencies
3. Restart the service with latest code
4. Deploy within ~2-3 minutes

---

## 🛠️ Troubleshooting

### App Won't Deploy
- Check **Build logs** in Render dashboard
- Verify `package.json` has correct structure
- Ensure `render.yaml` is committed to main branch

### "Cannot GET /"
- Verify app has finished building (check status)
- Clear browser cache and refresh
- Check **Runtime logs** for errors

### Database Errors
- Free tier restarts clear the database
- This is normal behavior
- Data persists while service is running
- Upgrade plan for persistent storage

### Upload Fails
- Check file size (Render has limits)
- Verify `/tmp/uploads` directory exists (auto-created)
- Consider using cloud storage for production

---

## 📊 Monitoring & Logs

In Render dashboard:
- **Metrics**: View CPU, memory, bandwidth usage
- **Logs**: Check real-time application logs
- **Environment**: View or update environment variables
- **Deploys**: See deployment history and rollback options

---

## Your Live URL
Once deployed, your Money Manager will be available at:
```
https://money-manager-xxxxx.onrender.com
```

Replace `xxxxx` with the actual service name assigned by Render.

---

## Next Steps

1. ✅ Pushed `render.yaml` to GitHub
2. Go to [render.com](https://render.com) and follow steps above
3. Your app will be live in 3-5 minutes!
4. Share the URL with friends to try it out

**Questions?** Check Render's [documentation](https://docs.render.com) or deploy logs in dashboard.
