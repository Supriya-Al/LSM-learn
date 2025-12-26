# Netlify Deployment Guide for LMS Website

This guide will help you deploy your LMS website to Netlify (frontend) and Render (backend).

> **⚠️ IMPORTANT:** After deployment, you **MUST** set up your database! See `DATABASE_SETUP.md` for complete instructions. Without database setup, you'll see "No courses available" even after successful deployment.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Netlify Account** - Sign up at https://www.netlify.com
3. **Render Account** - Sign up at https://render.com (for backend)
4. **Supabase Project** - Your Supabase credentials

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Push Backend Code to GitHub
Make sure your `server` folder is in your GitHub repository.

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`Supriya-AI/LSM-learn`)
4. Configure the service:
   - **Name**: `lms-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Root Directory**: `server` (important!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose **Free** (or paid if needed)

### Step 3: Set Environment Variables in Render

Click on **"Environment"** tab and add these variables:

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

**Important Notes:**
- Replace `your_supabase_url` with your actual Supabase project URL
- Replace `your_supabase_service_role_key` with your Supabase service role key (found in Supabase Dashboard → Settings → API)
- Replace `your-netlify-site.netlify.app` with your Netlify site URL (you'll get this after deploying frontend)

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (usually 2-5 minutes)
3. Copy your backend URL (e.g., `https://lms-backend.onrender.com`)

---

## 🌐 Part 2: Deploy Frontend to Netlify

### Step 1: Connect GitHub Repository to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"GitHub"** and authorize Netlify
4. Select your repository: `Supriya-AI/LSM-learn`

### Step 2: Configure Build Settings

Netlify should auto-detect these settings (from `netlify.toml`):
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: `/` (root)

If not auto-detected, set them manually.

### Step 3: Set Environment Variables in Netlify

Before deploying, go to **"Site settings"** → **"Environment variables"** and add:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important Notes:**
- Replace `your-backend-url.onrender.com` with your Render backend URL (from Part 1)
- Replace `your_supabase_url` with your Supabase project URL
- Replace `your_supabase_anon_key` with your Supabase anonymous key (found in Supabase Dashboard → Settings → API)

### Step 4: Deploy Frontend

1. Click **"Deploy site"**
2. Wait for build to complete (usually 2-3 minutes)
3. Your site will be live at `https://random-name.netlify.app`

### Step 5: Update CORS in Render

After getting your Netlify URL, go back to Render:
1. Open your backend service
2. Go to **"Environment"** tab
3. Update `CORS_ORIGIN` to your Netlify URL: `https://your-site.netlify.app`
4. Save and redeploy

---

## 🔄 Part 3: Update Environment Variables

### Update Frontend (Netlify)

1. Go to Netlify Dashboard → Your Site → **"Site settings"** → **"Environment variables"**
2. Update `VITE_API_URL` with your Render backend URL:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
3. Click **"Trigger deploy"** → **"Deploy site"** to rebuild

### Update Backend (Render)

1. Go to Render Dashboard → Your Service → **"Environment"**
2. Update `CORS_ORIGIN` with your Netlify URL:
   ```
   CORS_ORIGIN=https://your-site.netlify.app
   ```
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## ✅ Verification Checklist

- [ ] Backend deployed on Render and accessible
- [ ] Frontend deployed on Netlify
- [ ] All environment variables set correctly
- [ ] CORS configured properly
- [ ] Site loads without errors
- [ ] Login functionality works
- [ ] API calls work correctly

---

## 🔧 Troubleshooting

### Frontend shows "Network Error" or "CORS Error"
- Check that `CORS_ORIGIN` in Render matches your Netlify URL exactly
- Ensure `VITE_API_URL` in Netlify points to your Render backend

### Backend returns 401 Unauthorized
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active

### Build fails on Netlify
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Backend deployment fails on Render
- Check that `server` folder contains `package.json` and `server.js`
- Verify `start` script exists in `server/package.json`
- Check Render logs for specific errors

---

## 📝 Custom Domain (Optional)

### Netlify Custom Domain
1. Go to Netlify → Your Site → **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

### Update Environment Variables
After adding custom domain, update:
- Netlify: `VITE_API_URL` (if using custom domain for backend)
- Render: `CORS_ORIGIN` to your custom domain

---

## 🗄️ Part 4: Database Setup (REQUIRED!)

**⚠️ CRITICAL:** After deployment, your database is empty! You must set up the database schema and create initial data.

1. **Read `DATABASE_SETUP.md`** - Complete guide for database setup
2. **Run SQL schemas** in Supabase SQL Editor:
   - `supabase-schema.sql`
   - `course-curriculum-schema.sql`
   - `certificates-schema.sql`
3. **Create admin user** - Update your profile to admin role
4. **Create courses** - Add your first course through admin panel

**Without this step, you'll see "No courses available" even though deployment succeeded!**

---

## 🎉 You're Done!

Your LMS website should now be live on Netlify with the backend running on Render!

**Next Steps:**
1. ✅ Complete database setup (see `DATABASE_SETUP.md`)
2. ✅ Create your first course
3. ✅ Test all functionality

**Quick Links:**
- Netlify Dashboard: https://app.netlify.com
- Render Dashboard: https://dashboard.render.com
- Supabase Dashboard: https://app.supabase.com
- Database Setup Guide: See `DATABASE_SETUP.md`

