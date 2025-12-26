# 🚀 Quick Deployment Steps

## Step 1: Deploy Backend (Render) - 5 minutes

1. **Go to Render**: https://dashboard.render.com
2. **New Web Service** → Connect GitHub → Select `Supriya-AI/LSM-learn`
3. **Settings**:
   - Name: `lms-backend`
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
4. **Environment Variables**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   CORS_ORIGIN=https://your-site.netlify.app (update after Netlify deploy)
   PORT=10000
   ```
5. **Deploy** → Copy backend URL (e.g., `https://lms-backend.onrender.com`)

---

## Step 2: Deploy Frontend (Netlify) - 3 minutes

1. **Go to Netlify**: https://app.netlify.com
2. **Add new site** → Import from GitHub → Select `Supriya-AI/LSM-learn`
3. **Build settings** (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Environment Variables** (Site settings → Environment):
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
5. **Deploy** → Copy site URL (e.g., `https://lms-site.netlify.app`)

---

## Step 3: Update CORS - 1 minute

1. Go back to **Render** → Your service → Environment
2. Update `CORS_ORIGIN` to your Netlify URL
3. Redeploy backend

---

## Step 4: Rebuild Frontend - 1 minute

1. Go to **Netlify** → Your site → Deploys
2. Click **"Trigger deploy"** → **"Deploy site"**

---

## Step 4: Setup Database (REQUIRED!) - 5 minutes

**⚠️ IMPORTANT:** Your database is empty! You must set it up or you'll see "No courses available".

1. Go to **Supabase** → Your Project → **SQL Editor**
2. Run these 3 SQL files in order:
   - `supabase-schema.sql`
   - `course-curriculum-schema.sql`
   - `certificates-schema.sql`
3. Create admin user (see `DATABASE_SETUP.md` for details)
4. Create your first course through admin panel

**See `DATABASE_SETUP.md` for complete instructions!**

---

## ✅ Done! Your site is live! 🎉

**Total time: ~15 minutes** (including database setup)

---

## 📍 Where to Find Your Keys

### Supabase Keys:
- Go to: https://app.supabase.com → Your Project → Settings → API
- **URL**: Project URL
- **Anon Key**: `anon` `public` key
- **Service Role Key**: `service_role` `secret` key (⚠️ Keep secret!)

### Render Backend URL:
- After deployment, find it in Render dashboard
- Format: `https://your-service-name.onrender.com`

### Netlify Site URL:
- After deployment, find it in Netlify dashboard
- Format: `https://random-name.netlify.app`

