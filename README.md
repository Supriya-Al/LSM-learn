# Learning Management System (LMS)

A comprehensive Learning Management System built with React, Node.js, and Supabase, featuring role-based access control with separate Admin and User portals.

## Features

### Admin Portal
- **User Management**: View and manage all users, update roles
- **Course Management**: Create, edit, and delete courses
- **Attendance Management**: Mark and track student attendance
- **Reports & Analytics**: View detailed analytics and export attendance reports
- **Dashboard**: Overview of system statistics with charts and graphs

### User Portal
- **Dashboard**: Personal statistics and recent activity
- **Course Catalog**: Browse and enroll in available courses
- **My Enrollments**: Track course progress and update completion status
- **Attendance**: View personal attendance records
- **History**: View completed and dropped courses

### Advanced Features
- **Course Progress Tracking**: Real-time progress updates with visual indicators
- **Analytics Dashboard**: Comprehensive statistics for admins
- **Notifications System**: User notifications (ready for implementation)
- **Exportable Reports**: CSV export functionality for attendance reports
- **Row Level Security (RLS)**: Strict security policies in Supabase
- **Protected Routes**: Role-based route protection
- **Responsive Design**: Clean, modern UI built with Tailwind CSS

## Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS, Recharts
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL script from `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API
4. Get your service role key from Settings > API (keep this secret!)

### 2. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. In the root directory, create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001/api
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Creating Your First Admin User

1. Sign up through the Supabase Auth UI or use the Supabase dashboard
2. Go to Authentication > Users in Supabase dashboard
3. Find your user and note the user ID
4. Run this SQL in Supabase SQL Editor:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```

Alternatively, you can sign up through the app and then update your role in the database.

## Project Structure

```
LSM/
├── server/                 # Node.js backend
│   ├── server.js          # Express server and API routes
│   └── package.json       # Backend dependencies
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/               # Utilities
│   │   ├── api.js
│   │   └── supabase.js
│   ├── pages/
│   │   ├── admin/         # Admin portal pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Attendance.jsx
│   │   │   └── Reports.jsx
│   │   ├── user/          # User portal pages
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Enrollments.jsx
│   │   │   ├── UserAttendance.jsx
│   │   │   └── History.jsx
│   │   └── Login.jsx
│   ├── App.jsx            # Main app component with routing
│   └── main.jsx           # Entry point
├── supabase-schema.sql    # Database schema and RLS policies
└── package.json          # Frontend dependencies
```

## Database Schema

### Tables
- **profiles**: User profiles with roles (admin/user)
- **courses**: Course information
- **enrollments**: User course enrollments with progress tracking
- **attendance**: Attendance records
- **notifications**: User notifications

### Security
All tables have Row Level Security (RLS) enabled with strict policies:
- Users can only view/edit their own data
- Admins have full access to all data
- Policies are enforced at the database level

## API Endpoints

### Authentication
- Uses Supabase Auth directly from frontend

### Backend API (requires authentication token)
- `GET /api/profile` - Get current user profile
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `GET /api/courses` - Get courses
- `POST /api/admin/courses` - Create course (admin only)
- `PUT /api/admin/courses/:id` - Update course (admin only)
- `DELETE /api/admin/courses/:id` - Delete course (admin only)
- `GET /api/enrollments` - Get enrollments
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/:id` - Update enrollment progress
- `GET /api/attendance` - Get attendance records
- `POST /api/admin/attendance` - Mark attendance (admin only)
- `GET /api/notifications` - Get notifications
- `GET /api/analytics/courses` - Course analytics (admin only)
- `GET /api/analytics/users` - User analytics (admin only)
- `GET /api/reports/attendance` - Attendance report (admin only)

## Development

### Backend
```bash
cd server
npm run dev
```

### Frontend
```bash
npm run dev
```

## Building for Production

### Frontend
```bash
npm run build
```

### Backend
```bash
cd server
npm start
```

## Security Notes

- Never commit `.env` files
- Service role key should only be used on the backend
- RLS policies provide an additional security layer
- All API routes verify authentication tokens
- Admin routes check for admin role

## License

MIT
