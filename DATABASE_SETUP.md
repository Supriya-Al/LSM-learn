# 🗄️ Database Setup Guide - After Deployment

After deploying to Netlify and Render, you need to set up your Supabase database. This guide will walk you through creating all necessary tables and initial data.

---

## 📋 Prerequisites

1. **Supabase Project** - You should have a Supabase project created
2. **Supabase Dashboard Access** - https://app.supabase.com
3. **SQL Editor Access** - In your Supabase project

---

## 🚀 Step 1: Run Database Schema Files

You need to run **3 SQL schema files** in your Supabase SQL Editor in this order:

### 1.1 Run Base Schema

1. Go to your Supabase project: https://app.supabase.com
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Open `supabase-schema.sql` from your project
5. Copy the entire contents and paste into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter`)
7. ✅ Verify: You should see "Success. No rows returned"

### 1.2 Run Course Curriculum Schema

1. In the same SQL Editor, click **"New query"**
2. Open `course-curriculum-schema.sql` from your project
3. Copy the entire contents and paste into the SQL Editor
4. Click **"Run"**
5. ✅ Verify: Success message

### 1.3 Run Certificates Schema

1. In the same SQL Editor, click **"New query"**
2. Open `certificates-schema.sql` from your project
3. Copy the entire contents and paste into the SQL Editor
4. Click **"Run"**
5. ✅ Verify: Success message

---

## ✅ Step 2: Verify Tables Were Created

1. In Supabase Dashboard, go to **"Table Editor"**
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `courses`
   - ✅ `enrollments`
   - ✅ `attendance`
   - ✅ `course_curriculum`
   - ✅ `certificates`
   - ✅ `lessons` (if using lesson-based courses)
   - ✅ `sections` (if using lesson-based courses)
   - ✅ `user_progress` (if using lesson-based courses)

---

## 👤 Step 3: Create Your First Admin User

### Option A: Sign Up Through the Website (Recommended)

1. Go to your deployed Netlify site
2. Click **"Sign Up"** or **"Register"**
3. Create an account with your email
4. After signing up, you'll be a regular user by default

### Option B: Create Admin User via Supabase

1. Go to Supabase Dashboard → **"Authentication"** → **"Users"**
2. Find your user (or create one)
3. Note the user's **UUID** (ID)

4. Go to **"SQL Editor"** → **"New query"**
5. Run this SQL (replace `YOUR_USER_UUID` with your actual user ID):

```sql
-- Update your profile to admin role
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_UUID';

-- Verify it worked
SELECT id, email, full_name, role 
FROM profiles 
WHERE id = 'YOUR_USER_UUID';
```

---

## 📚 Step 4: Create Your First Course

### Option A: Through Admin Panel (Recommended)

1. Log in to your deployed site as admin
2. Go to **"Courses"** in admin panel
3. Click **"Create New Course"**
4. Fill in:
   - **Title**: e.g., "Introduction to Web Development"
   - **Description**: Course description
   - **Status**: Active
   - **Start Date**: Today's date
   - **End Date**: Future date
   - **Total Days**: 7-30 (e.g., 10)
5. Click **"Next"** to add curriculum (videos, PDFs, quizzes)
6. Click **"Save Course"**

### Option B: Insert Course via SQL

1. Go to Supabase → **"SQL Editor"** → **"New query"**
2. Run this SQL (replace `YOUR_ADMIN_UUID` with your admin user ID):

```sql
-- Insert a sample course
INSERT INTO courses (title, description, instructor_id, status, start_date, end_date, total_days)
VALUES (
  'Introduction to Web Development',
  'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
  'YOUR_ADMIN_UUID',
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  10
)
RETURNING *;
```

---

## 🔍 Step 5: Verify Everything Works

### Check Frontend Connection

1. Go to your Netlify site
2. Try to log in
3. If you're admin, go to **"Courses"** → You should see your course
4. If you're a user, go to **"Courses"** → You should see available courses

### Check Backend Connection

1. Open browser console (F12)
2. Go to **"Network"** tab
3. Navigate around the site
4. Check for any API errors (should be 200 status codes)

### Common Issues

**❌ "No courses available"**
- ✅ Check: Did you create a course? (Step 4)
- ✅ Check: Is the course status "active"?
- ✅ Check: Are environment variables set correctly in Netlify?

**❌ "401 Unauthorized" errors**
- ✅ Check: Supabase URL and keys are correct in Netlify environment variables
- ✅ Check: Backend CORS_ORIGIN matches your Netlify URL
- ✅ Check: User is logged in

**❌ "Network Error" or "CORS Error"**
- ✅ Check: Backend URL in `VITE_API_URL` is correct
- ✅ Check: `CORS_ORIGIN` in Render matches your Netlify URL exactly
- ✅ Check: Backend is running (check Render logs)

---

## 📝 Step 6: Add Sample Data (Optional)

If you want to add more sample courses, users, or enrollments, you can use the SQL Editor:

### Add Sample Course with Curriculum

```sql
-- First, get your admin user ID
SELECT id, email FROM profiles WHERE role = 'admin' LIMIT 1;

-- Then insert a course (replace ADMIN_ID with the ID from above)
INSERT INTO courses (title, description, instructor_id, status, start_date, end_date, total_days)
VALUES (
  'UI/UX Design Fundamentals',
  'Master the principles of user interface and user experience design.',
  'ADMIN_ID',
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '21 days',
  14
)
RETURNING id;

-- Add curriculum for Day 1 (replace COURSE_ID with the returned ID)
INSERT INTO course_curriculum (course_id, day_number, video_url, pdf_url, quiz_data)
VALUES (
  'COURSE_ID',
  1,
  'https://example.com/video1.mp4',
  'https://example.com/day1.pdf',
  '{"questions": [{"question": "What is UI?", "options": ["User Interface", "User Interaction", "User Input"], "correctAnswer": 0, "passingScore": 70}]}'::jsonb
);
```

---

## 🎯 Quick Checklist

After deployment, make sure you've completed:

- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Run `course-curriculum-schema.sql` in Supabase SQL Editor
- [ ] Run `certificates-schema.sql` in Supabase SQL Editor
- [ ] Verified all tables exist in Table Editor
- [ ] Created an admin user (or updated existing user to admin)
- [ ] Created at least one course
- [ ] Tested login on deployed site
- [ ] Verified courses appear on the site
- [ ] Checked browser console for errors

---

## 🔗 Important Links

- **Supabase Dashboard**: https://app.supabase.com
- **Supabase SQL Editor**: https://app.supabase.com → Your Project → SQL Editor
- **Supabase Table Editor**: https://app.supabase.com → Your Project → Table Editor
- **Supabase Authentication**: https://app.supabase.com → Your Project → Authentication

---

## 💡 Pro Tips

1. **Always test locally first** - Make sure everything works on `localhost` before deploying
2. **Keep SQL files in version control** - This helps track database changes
3. **Use Supabase migrations** - For production, consider using Supabase migrations instead of manual SQL
4. **Backup your database** - Before making major changes, export your data
5. **Monitor Supabase logs** - Check for any errors in Supabase Dashboard → Logs

---

## 🆘 Still Having Issues?

If you're still seeing "No courses available" after following all steps:

1. **Check Supabase Connection**:
   - Go to Supabase Dashboard → Settings → API
   - Verify your URL and keys match what's in Netlify environment variables

2. **Check Backend Logs**:
   - Go to Render Dashboard → Your Service → Logs
   - Look for any errors

3. **Check Frontend Console**:
   - Open browser DevTools (F12)
   - Check Console and Network tabs for errors

4. **Verify Environment Variables**:
   - Netlify: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Render: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`

---

**Once you complete these steps, your LMS should be fully functional with data!** 🎉

