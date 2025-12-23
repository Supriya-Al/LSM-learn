import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Create a separate Supabase client for auth (using service role key works for getUser)
const authSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to verify user token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    console.error('No token provided in request');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await authSupabase.auth.getUser(token);
    if (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ error: 'Invalid token: ' + error.message });
    }
    if (!user) {
      console.error('No user found for token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.log('Token verified for user:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification exception:', error);
    res.status(401).json({ error: 'Token verification failed: ' + error.message });
  }
};

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile: ' + error.message });
    }

    // If profile doesn't exist, create it
    if (!data) {
      console.log('Profile not found, creating for user:', req.user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return res.status(500).json({ error: 'Failed to create profile: ' + createError.message });
      }

      return res.json(newProfile);
    }

    res.json(data);
  } catch (error) {
    console.error('Profile endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update user role
app.put('/api/admin/users/:id', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courses for authenticated users
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    // Ensure profile exists
    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    // If profile doesn't exist, create it
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        })
        .select('role')
        .single();
      profile = newProfile;
    }

    let query = supabase.from('courses').select('*, instructor:profiles!instructor_id(id, full_name, email)');
    
    if (profile?.role !== 'admin') {
      query = query.eq('status', 'active');
    }

    const { data: courses, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get enrollment counts for each course
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);
        
        return {
          ...course,
          enrollment_count: count || 0,
        };
      })
    );

    res.json(coursesWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public: Get all active courses (no auth required)
app.get('/api/public/courses', async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*, instructor:profiles!instructor_id(id, full_name, email)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Public courses fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch courses: ' + error.message });
    }

    // Attach enrollment_count = 0 (public endpoint doesn’t know user)
    const coursesWithCounts = (courses || []).map(course => ({
      ...course,
      enrollment_count: course.enrollment_count || 0,
    }));

    res.json(coursesWithCounts);
  } catch (error) {
    console.error('Public courses endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Admin: Create course
app.post('/api/admin/courses', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({ ...req.body, instructor_id: req.user.id })
      .select('*, instructor:profiles!instructor_id(id, full_name, email)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update course
app.put('/api/admin/courses/:id', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('courses')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*, instructor:profiles!instructor_id(id, full_name, email)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete course
app.delete('/api/admin/courses/:id', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user enrollments
app.get('/api/enrollments', verifyToken, async (req, res) => {
  try {
    // Ensure profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    // If profile doesn't exist, create it
    if (!profile) {
      await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        });
    }

    let query = supabase
      .from('enrollments')
      .select('*, course:courses(*), user:profiles!user_id(id, full_name, email)');

    if (profile?.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query.order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Enrollments fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch enrollments: ' + error.message });
    }

    // Calculate and update progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      (data || []).map(async (enrollment) => {
        try {
          console.log(`📊 Calculating progress for enrollment: ${enrollment.id}, course: ${enrollment.course_id}, user: ${enrollment.user_id}`);
          
          // Calculate current progress based on quiz completions
          const { data: quizLessons, error: quizError } = await supabase
            .from('lessons')
            .select('id, day_number')
            .eq('course_id', enrollment.course_id)
            .eq('lesson_type', 'quiz');

          if (quizError) {
            console.error(`❌ Error fetching quiz lessons for course ${enrollment.course_id}:`, quizError);
          }

          const totalDays = quizLessons?.length || 0;
          console.log(`   Total quiz days: ${totalDays}`);

          if (totalDays > 0) {
            const { data: passedProgress, error: progressError } = await supabase
              .from('user_progress')
              .select('lesson_id, quiz_passed')
              .eq('user_id', enrollment.user_id)
              .eq('course_id', enrollment.course_id)
              .eq('quiz_passed', true);

            if (progressError) {
              console.error(`❌ Error fetching user progress for enrollment ${enrollment.id}:`, progressError);
            }

            const completedDays = passedProgress?.length || 0;
            const progressPercentage = Math.round((completedDays / totalDays) * 100);
            
            console.log(`   Completed days: ${completedDays}/${totalDays} = ${progressPercentage}%`);
            console.log(`   Current enrollment progress: ${enrollment.progress}%`);

            // Always update enrollment in database with calculated progress
            const { error: updateError } = await supabase
              .from('enrollments')
              .update({
                progress: progressPercentage,
                status: progressPercentage === 100 ? 'completed' : enrollment.status === 'dropped' ? 'dropped' : 'enrolled',
                completed_at: progressPercentage === 100 ? new Date().toISOString() : enrollment.completed_at
              })
              .eq('id', enrollment.id);

            if (updateError) {
              console.error(`❌ Error updating enrollment ${enrollment.id}:`, updateError);
            } else {
              console.log(`✅ Updated enrollment ${enrollment.id} progress to ${progressPercentage}%`);
            }
            
            // Update the enrollment object with new progress
            enrollment.progress = progressPercentage;
            enrollment.status = progressPercentage === 100 ? 'completed' : enrollment.status === 'dropped' ? 'dropped' : 'enrolled';
          } else {
            console.log(`   No quiz lessons found for course ${enrollment.course_id}`);
          }
        } catch (progressError) {
          console.error(`❌ Error calculating progress for enrollment ${enrollment.id}:`, progressError);
        }
        return enrollment;
      })
    );
    
    res.json(enrollmentsWithProgress || []);
  } catch (error) {
    console.error('Enrollments endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Enroll in course
app.post('/api/enrollments', verifyToken, async (req, res) => {
  try {
    console.log('Enrollment request:', { userId: req.user.id, courseId: req.body.course_id });
    
    // Validate course_id
    if (!req.body.course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Ensure user profile exists - CRITICAL for foreign key constraint
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!profile) {
      console.log('Profile not found, creating for user:', req.user.id);
      // Create profile if it doesn't exist - MUST succeed before enrollment
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email || 'user@example.com',
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        })
        .select('id')
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If it's a duplicate key error, try to fetch again
        if (profileError.code === '23505') {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', req.user.id)
            .maybeSingle();
          profile = existingProfile;
        } else {
          return res.status(500).json({ 
            error: 'Failed to create user profile. Please contact support.',
            details: profileError.message 
          });
        }
      } else {
        profile = newProfile;
      }
    }

    // Double-check profile exists before proceeding
    if (!profile || !profile.id) {
      console.error('Profile still not found after creation attempt:', req.user.id);
      return res.status(500).json({ 
        error: 'User profile issue. Please refresh and try again.' 
      });
    }

    // Validate course_id format
    const courseIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!courseIdRegex.test(req.body.course_id)) {
      console.error('Invalid course ID format:', req.body.course_id);
      return res.status(400).json({ 
        error: 'Invalid course ID format. Please refresh the page and try again.' 
      });
    }

    // Check if course exists - use maybeSingle to avoid error when not found
    console.log('Looking up course with ID:', req.body.course_id);
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, status')
      .eq('id', req.body.course_id)
      .maybeSingle();

    if (courseError) {
      console.error('Course lookup error:', courseError);
      console.error('Error code:', courseError.code);
      console.error('Error message:', courseError.message);
      return res.status(500).json({ 
        error: 'Error checking course. Please try again.',
        details: courseError.message 
      });
    }

    if (!course) {
      console.error('=== COURSE NOT FOUND ===');
      console.error('Requested course ID:', req.body.course_id);
      console.error('Course ID type:', typeof req.body.course_id);
      console.error('Course ID length:', req.body.course_id?.length);
      console.error('User ID:', req.user.id);
      
      // List ALL available courses for debugging
      const { data: allCourses, error: listError } = await supabase
        .from('courses')
        .select('id, title, status')
        .order('created_at', { ascending: false });
      
      if (!listError && allCourses) {
        console.log('=== ALL AVAILABLE COURSES ===');
        console.log('Total courses in DB:', allCourses.length);
        allCourses.forEach((c, index) => {
          console.log(`${index + 1}. ID: ${c.id}, Title: ${c.title}, Status: ${c.status}`);
        });
        
        // Check if there's a similar ID (maybe case sensitivity or formatting issue)
        const similarId = allCourses.find(c => 
          c.id.toLowerCase() === req.body.course_id?.toLowerCase() ||
          c.id.replace(/-/g, '') === req.body.course_id?.replace(/-/g, '')
        );
        if (similarId) {
          console.log('Found similar ID:', similarId);
        }
      } else if (listError) {
        console.error('Error listing courses:', listError);
      }
      
      return res.status(404).json({ 
        error: 'Course not found. Please refresh the page and try again.',
        debug: {
          requestedId: req.body.course_id,
          availableCount: allCourses?.length || 0,
          availableIds: allCourses?.slice(0, 5).map(c => c.id) || []
        }
      });
    }

    console.log('Course found:', { id: course.id, title: course.title, status: course.status });

    if (course.status !== 'active') {
      return res.status(400).json({ error: 'Cannot enroll in inactive course' });
    }

    // Check if already enrolled - use profile.id for consistency
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', profile.id)
      .eq('course_id', req.body.course_id)
      .maybeSingle();

    if (checkError) {
      console.error('Check enrollment error:', checkError);
    }

    if (existingEnrollment) {
      return res.status(409).json({ error: 'You are already enrolled in this course' });
    }

    // Create enrollment using service role (bypasses RLS)
    // CRITICAL: Use profile.id (not req.user.id) to ensure foreign key constraint is satisfied
    const enrollmentData = {
      user_id: profile.id, // Use verified profile.id
      course_id: req.body.course_id,
      progress: 0,
      status: 'enrolled'
    };

    console.log('Inserting enrollment:', enrollmentData);
    console.log('User ID from token:', req.user.id);
    console.log('Profile ID to use:', profile.id);
    console.log('IDs match:', req.user.id === profile.id);

    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollmentData)
      .select('*, course:courses(*)')
      .single();

    if (error) {
      console.error('Enrollment insert error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific database errors
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(409).json({ error: 'You are already enrolled in this course' });
      }
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        return res.status(404).json({ error: 'Invalid course. Please refresh the page and try again.' });
      }
      
      return res.status(500).json({ 
        error: 'Failed to enroll in course. Please try again.',
        details: error.message
      });
    }

    console.log('Enrollment successful:', { id: data.id, course: data.course?.title });

    // Create a notification for this new enrollment (non-blocking)
    try {
      const notificationPayload = {
        user_id: profile.id,
        title: 'Enrolled in new course',
        message: data.course?.title
          ? `You have successfully enrolled in "${data.course.title}".`
          : 'You have successfully enrolled in a new course.',
        type: 'success',
        read: false,
      };

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notificationPayload);

      if (notifError) {
        console.error('Notification creation error after enrollment:', notifError);
      } else {
        console.log('Enrollment notification created for user:', profile.id);
      }
    } catch (notifException) {
      console.error('Notification creation exception after enrollment:', notifException);
    }

    // Return enrollment with course data for redirect
    res.json({
      ...data,
      redirectTo: `/courses/${data.course_id}`
    });
  } catch (error) {
    console.error('Enrollment catch error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to enroll in course. Please try again.' 
    });
  }
});

// Update enrollment progress
app.put('/api/enrollments/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*, course:courses(*)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance
app.get('/api/attendance', verifyToken, async (req, res) => {
  try {
    // Ensure profile exists
    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        })
        .select('role')
        .single();
      profile = newProfile;
    }

    let query = supabase
      .from('attendance')
      .select('*, user:profiles!user_id(id, full_name, email), course:courses(id, title)');

    if (profile?.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    if (req.query.course_id) {
      query = query.eq('course_id', req.query.course_id);
    }

    if (req.query.date) {
      query = query.eq('date', req.query.date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Attendance fetch error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Mark attendance (for users to mark their own attendance)
app.post('/api/attendance', verifyToken, async (req, res) => {
  try {
    const { course_id, session, date, status, notes } = req.body;

    // Validate required fields
    if (!course_id || !session || !date || !status) {
      return res.status(400).json({ error: 'Course ID, session, date, and status are required' });
    }

    // Normalize / validate session label (e.g. "Day 1")
    const sessionMatch = String(session).match(/Day\s*(\d+)/i);
    if (!sessionMatch || !sessionMatch[1]) {
      return res.status(400).json({ error: 'Invalid session format. Expected something like "Day 1".' });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: present, absent, late, or excused' });
    }

    // Check if user is enrolled in the course and that enrollment is active
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', req.user.id)
      .eq('course_id', course_id)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course to mark attendance' });
    }

    // Do not allow attendance for completed or dropped courses
    if (enrollment.status && enrollment.status !== 'enrolled') {
      return res.status(403).json({
        error: 'Attendance is only allowed for active (in-progress) courses. This course is already completed or dropped.',
      });
    }

    // Check if attendance already exists for this session and course
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', course_id)
      .eq('session', session)
      .maybeSingle();

    if (existing) {
      // Update existing attendance
      const { data, error } = await supabase
        .from('attendance')
        .update({
          session,
          status,
          notes: notes || null,
          marked_by: req.user.id
        })
        .eq('id', existing.id)
        .select('*, course:courses(id, title)')
        .single();

      if (error) throw error;
      return res.json({ ...data, updated: true });
    }

    // Create new attendance record
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        user_id: req.user.id,
        course_id,
        session,
        date,
        status,
        notes: notes || null,
        marked_by: req.user.id
      })
      .select('*, course:courses(id, title)')
      .single();

    if (error) {
      console.error('Attendance creation error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Attendance already marked for this date' });
      }
      throw error;
    }

    // Check if all days are completed and auto-update enrollment
    await checkAndUpdateEnrollmentCompletion(req.user.id, course_id);

    res.json({ ...data, updated: false });
  } catch (error) {
    console.error('Attendance mark error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark attendance' });
  }
});

// Admin: Mark attendance
app.post('/api/admin/attendance', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        ...req.body,
        marked_by: req.user.id
      }, {
        onConflict: 'user_id,course_id,date'
      })
      .select('*, user:profiles!user_id(id, full_name, email), course:courses(id, title)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    console.log('📬 Fetching notifications for user:', req.user.id);
    
    // Ensure profile exists (similar to enrollments endpoint)
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        })
        .select('id')
        .single();
      profile = newProfile;
      console.log('✅ Created profile for notifications fetch');
    }
    
    // Check if user has any notifications
    const { data: existingNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', req.user.id)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking notifications:', checkError);
    }

    // If user has no notifications, create a welcome notification
    if (!existingNotifications || existingNotifications.length === 0) {
      console.log('📝 Creating welcome notification for new user:', req.user.id);
      const welcomeNotification = {
        user_id: req.user.id,
        title: 'Welcome to LMS Platform! 🎉',
        message: 'Welcome to our Learning Management System! Start exploring courses to begin your learning journey. You can browse available courses, enroll in them, and track your progress.',
        type: 'info',
        read: false
      };

      const { data: insertedNotification, error: insertError } = await supabase
        .from('notifications')
        .insert(welcomeNotification)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating welcome notification:', insertError);
        console.error('❌ Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
      } else {
        console.log('✅ Welcome notification created:', insertedNotification?.id);
      }
    }
    
    // Fetch notifications again (after potential welcome notification creation)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Notifications query error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} notifications for user ${req.user.id}`);
    if (data && data.length > 0) {
      console.log('📋 Sample notification:', {
        id: data[0].id,
        title: data[0].title,
        read: data[0].read,
        created_at: data[0].created_at
      });
    } else {
      console.log('⚠️ No notifications found for user. Welcome notification may have failed to create.');
    }
    res.json(data || []);
  } catch (error) {
    console.error('❌ Notifications endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notification for current user (for testing)
app.post('/api/notifications', verifyToken, async (req, res) => {
  try {
    console.log('📝 POST /api/notifications - Creating notification for user:', req.user.id);
    console.log('📝 Request body:', req.body);
    
    const { title, message, type = 'info' } = req.body;
    
    if (!title || !message) {
      console.error('❌ Missing title or message');
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Ensure profile exists
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!profile) {
      console.log('📝 Creating profile for notification creation');
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
          role: req.user.user_metadata?.role || 'user'
        })
        .select('id')
        .single();
      profile = newProfile;
    }

    const notification = {
      user_id: req.user.id,
      title,
      message,
      type,
      read: false
    };

    console.log('📝 Inserting notification:', notification);
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting notification:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('✅ Notification created successfully:', data?.id);
    res.json(data);
  } catch (error) {
    console.error('❌ POST /api/notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create notification
app.post('/api/admin/notifications', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Course statistics
app.get('/api/analytics/courses', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title');

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, status, progress');

    const stats = courses?.map(course => {
      const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || [];
      return {
        course_id: course.id,
        course_title: course.title,
        total_enrollments: courseEnrollments.length,
        completed: courseEnrollments.filter(e => e.status === 'completed').length,
        average_progress: courseEnrollments.length > 0
          ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / courseEnrollments.length)
          : 0
      };
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: User statistics
app.get('/api/analytics/users', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at');

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id, status, progress');

    const stats = users?.map(user => {
      const userEnrollments = enrollments?.filter(e => e.user_id === user.id) || [];
      return {
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        total_enrollments: userEnrollments.length,
        completed_courses: userEnrollments.filter(e => e.status === 'completed').length,
        average_progress: userEnrollments.length > 0
          ? Math.round(userEnrollments.reduce((sum, e) => sum + e.progress, 0) / userEnrollments.length)
          : 0
      };
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export attendance report
app.get('/api/reports/attendance', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let query = supabase
      .from('attendance')
      .select('*, user:profiles!user_id(id, full_name, email), course:courses(id, title)');

    if (req.query.course_id) {
      query = query.eq('course_id', req.query.course_id);
    }

    if (req.query.start_date && req.query.end_date) {
      query = query.gte('date', req.query.start_date).lte('date', req.query.end_date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check and update enrollment completion
async function checkAndUpdateEnrollmentCompletion(userId, courseId) {
  try {
    // For day-based course completion, consider only quiz lessons (one per day).
    const { data: quizLessons, error: quizLessonsError } = await supabase
      .from('lessons')
      .select('id, lesson_type')
      .eq('course_id', courseId)
      .eq('lesson_type', 'quiz');

    if (quizLessonsError) {
      console.error('checkAndUpdateEnrollmentCompletion: error fetching quiz lessons:', quizLessonsError);
      return false;
    }

    if (!quizLessons || quizLessons.length === 0) return false;

    // Get user progress for all lessons
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('lesson_id, quiz_passed')
      .eq('user_id', userId)
      .in('lesson_id', quizLessons.map(l => l.id));

    if (progressError) {
      console.error('checkAndUpdateEnrollmentCompletion: error fetching progress:', progressError);
      return false;
    }

    // Check if all quiz lessons (days) are passed
    const passedQuizzes = userProgress?.filter(p => p.quiz_passed === true) || [];
    const allDaysCompleted = passedQuizzes.length === quizLessons.length;

    if (allDaysCompleted) {
      // Update enrollment to completed
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          progress: 100,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (!updateError) {
        console.log(`✅ Auto-updated enrollment to completed for user ${userId}, course ${courseId}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking enrollment completion:', error);
    return false;
  }
}

// Refresh enrollment progress based on actual completion
app.post('/api/enrollments/:courseId/refresh-progress', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // First, update the progress percentage based on completed quiz days
    await updateEnrollmentProgress(req.user.id, courseId);
    
    // Then check and update enrollment completion status
    const updated = await checkAndUpdateEnrollmentCompletion(req.user.id, courseId);
    
    // Fetch updated enrollment with latest progress
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    
    if (updated) {
      res.json({ 
        success: true, 
        message: 'Enrollment updated to 100% - all days completed!',
        enrollment 
      });
    } else {
      // Get current day-based progress: number of quizzes passed vs total quizzes
      const { data: quizLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .eq('lesson_type', 'quiz');

      const totalDays = quizLessons?.length || 0;

      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('lesson_id, quiz_passed')
        .eq('user_id', req.user.id)
        .in('lesson_id', quizLessons?.map(l => l.id) || []);

      const completedCount = userProgress?.filter(p => p.quiz_passed === true).length || 0;

      res.json({
        success: true,
        message: `Progress refreshed. Current progress: ${completedCount}/${totalDays} days`,
        completedDays: completedCount,
        totalDays: totalDays,
        enrollment
      });
    }
  } catch (error) {
    console.error('Error refreshing enrollment progress:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh enrollment progress' });
  }
});

// Get certificate data for a course
app.get('/api/certificates/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*, course:courses(*), user:profiles!user_id(id, full_name, email)')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError) throw enrollmentError;
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Check if all days are completed first (this will auto-update enrollment if needed)
    await checkAndUpdateEnrollmentCompletion(req.user.id, courseId);

    // Refresh enrollment data after potential update
    const { data: updatedEnrollment } = await supabase
      .from('enrollments')
      .select('*, course:courses(*), user:profiles!user_id(id, full_name, email)')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    const finalEnrollment = updatedEnrollment || enrollment;

    // Check if course is completed (now check again after potential update)
    if (finalEnrollment.status !== 'completed' || finalEnrollment.progress !== 100) {
      return res.status(400).json({ 
        error: 'Course must be completed (100% progress) to generate certificate',
        eligible: false
      });
    }

    // Get all QUIZ lessons for the course (one per day)
    const { data: quizLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, day_number')
      .eq('course_id', courseId)
      .eq('lesson_type', 'quiz')
      .order('day_number', { ascending: true });

    if (lessonsError) throw lessonsError;

    if (!quizLessons || quizLessons.length === 0) {
      return res.status(400).json({ 
        error: 'No quiz lessons found for this course',
        eligible: false
      });
    }

    // Get user progress for quiz lessons only (including quiz scores)
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('lesson_id, quiz_passed, quiz_score')
      .eq('user_id', req.user.id)
      .in('lesson_id', quizLessons.map(l => l.id));

    if (progressError) throw progressError;

    // Check if all quiz lessons (days) are passed
    const passedQuizzes = userProgress?.filter(p => p.quiz_passed === true) || [];
    const allDaysCompleted = passedQuizzes.length === quizLessons.length;

    if (!allDaysCompleted) {
      return res.status(400).json({ 
        error: 'All course days must be completed to generate certificate',
        eligible: false,
        completedDays: passedQuizzes.length,
        totalDays: quizLessons.length
      });
    }

    // Calculate quiz average score from quiz lessons only
    const quizScores = userProgress
      ?.filter(p => p.quiz_score !== null && p.quiz_score !== undefined)
      .map(p => p.quiz_score) || [];
    const quizAverageScore = quizScores.length > 0
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
      : 0;

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .maybeSingle();

    // Format completion date (use updated enrollment if available)
    const finalEnrollmentForDate = updatedEnrollment || enrollment;
    const completionDate = finalEnrollmentForDate.completed_at 
      ? new Date(finalEnrollmentForDate.completed_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

    // Get course duration (total_days from course or count of quiz lessons/days)
    const courseDuration = finalEnrollmentForDate.course?.total_days || quizLessons.length || 30;

    res.json({
      eligible: true,
      certificateData: {
        studentName: profile?.full_name || finalEnrollmentForDate.user?.full_name || req.user.email?.split('@')[0] || 'Student',
        courseName: finalEnrollmentForDate.course?.title || 'Course',
        courseDuration: courseDuration,
        completionPercentage: finalEnrollmentForDate.progress || 100,
        quizAverageScore: Math.round(quizAverageScore * 10) / 10, // Round to 1 decimal
        completionDate: completionDate
      }
    });
  } catch (error) {
    console.error('Certificate data fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch certificate data' });
  }
});

// ============================================
// NEW LMS API ENDPOINTS
// ============================================

// Get course content with sections and lessons (Udemy-style)
app.get('/api/courses/:id/content', verifyToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, last_accessed_lesson_id')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course to view content' });
    }

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Get sections with lessons
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (sectionsError) throw sectionsError;

    // Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (lessonsError) throw lessonsError;

    // Get user progress for all lessons
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId);

    if (progressError) throw progressError;

    // Organize lessons by section
    const sectionsWithLessons = (sections || []).map(section => ({
      ...section,
      lessons: (lessons || [])
        .filter(lesson => lesson.section_id === section.id)
        .map(lesson => {
          const lessonProgress = (progress || []).find(p => p.lesson_id === lesson.id);
          return {
            ...lesson,
            progress: lessonProgress || null,
            completed: lessonProgress?.completed || false
          };
        })
    }));

    // Get lessons without sections (if any)
    const lessonsWithoutSections = (lessons || [])
      .filter(lesson => !lesson.section_id)
      .map(lesson => {
        const lessonProgress = (progress || []).find(p => p.lesson_id === lesson.id);
        return {
          ...lesson,
          progress: lessonProgress || null,
          completed: lessonProgress?.completed || false
        };
      });

    res.json({
      course,
      sections: sectionsWithLessons,
      ungroupedLessons: lessonsWithoutSections,
      lastAccessedLessonId: enrollment.last_accessed_lesson_id
    });
  } catch (error) {
    console.error('Error fetching course content:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch course content' });
  }
});

// Get single lesson with full content
app.get('/api/lessons/:id', verifyToken, async (req, res) => {
  try {
    const lessonId = req.params.id;

    // Get lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*, section:sections(*), course:courses(*)')
      .eq('id', lessonId)
      .single();

    if (lessonError) throw lessonError;

    // Check enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', lesson.course_id)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Get lesson content (video/pdf)
    const { data: content, error: contentError } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('lesson_id', lessonId);

    if (contentError) throw contentError;

    // Get quiz if lesson type is quiz
    let quiz = null;
    if (lesson.lesson_type === 'quiz') {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (quizError) throw quizError;
      quiz = quizData;

      if (quiz) {
        // Get questions with options
        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quiz.id)
          .order('order_index', { ascending: true });

        if (questionsError) throw questionsError;

        if (questions && questions.length > 0) {
          const questionsWithOptions = await Promise.all(
            questions.map(async (question) => {
              const { data: options } = await supabase
                .from('quiz_options')
                .select('*')
                .eq('question_id', question.id)
                .order('order_index', { ascending: true });

              return {
                ...question,
                options: options || []
              };
            })
          );

          quiz.questions = questionsWithOptions;
        } else {
          quiz.questions = [];
        }
      }
    }

    // Get user progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (progressError) throw progressError;

    // Determine if lesson is unlocked (check previous lessons)
    let isUnlocked = true;
    if (lesson.order_index > 0) {
      // Get previous lesson in same section
      const { data: previousLesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('section_id', lesson.section_id)
        .eq('order_index', lesson.order_index - 1)
        .maybeSingle();

      if (previousLesson) {
        const { data: prevProgress } = await supabase
          .from('user_progress')
          .select('completed, quiz_passed')
          .eq('user_id', req.user.id)
          .eq('lesson_id', previousLesson.id)
          .maybeSingle();

        // Unlock if previous lesson is completed (or if it's a quiz, must be passed)
        if (prevProgress) {
          isUnlocked = prevProgress.completed;
          if (prevProgress.quiz_passed !== null) {
            isUnlocked = prevProgress.quiz_passed;
          }
        } else {
          isUnlocked = false;
        }
      }
    }

    res.json({
      lesson: {
        ...lesson,
        content: content || [],
        quiz: quiz,
        progress: userProgress || null,
        isUnlocked
      }
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch lesson' });
  }
});

// Submit quiz
app.post('/api/quizzes/:id/submit', verifyToken, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers, timeTakenSeconds } = req.body; // answers: { question_id: option_id }

    // Get quiz with lesson info
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, lesson:lessons(id, course_id)')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // Check enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', quiz.lesson.course_id)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Get all questions with correct answers
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*, options:quiz_options(*)')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(question => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question.id];
      if (userAnswer) {
        const selectedOption = question.options.find(opt => opt.id === userAnswer);
        if (selectedOption && selectedOption.is_correct) {
          correctAnswers++;
          earnedPoints += question.points || 1;
        }
      }
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passing_score;

    // Save quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: req.user.id,
        quiz_id: quizId,
        lesson_id: quiz.lesson.id,
        score: score,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        passed: passed,
        time_taken_seconds: timeTakenSeconds,
        answers: answers,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Update or create user progress
    let { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('lesson_id', quiz.lesson.id)
      .maybeSingle();

    const progressData = {
      user_id: req.user.id,
      course_id: quiz.lesson.course_id,
      lesson_id: quiz.lesson.id,
      quiz_attempted: true,
      quiz_score: score,
      quiz_passed: passed,
      quiz_attempts: (progress?.quiz_attempts || 0) + 1,
      completed: passed, // Only complete if passed
      progress_percentage: passed ? 100 : 0,
      completed_at: passed ? new Date().toISOString() : null
    };

    if (progress) {
      await supabase
        .from('user_progress')
        .update(progressData)
        .eq('id', progress.id);
    } else {
      await supabase
        .from('user_progress')
        .insert(progressData);
    }

    // Update enrollment progress
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', quiz.lesson.course_id);

    const { data: completedLessons } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', quiz.lesson.course_id)
      .eq('completed', true);

    const courseProgress = allLessons && allLessons.length > 0
      ? Math.round((completedLessons?.length || 0) / allLessons.length * 100)
      : 0;

    await supabase
      .from('enrollments')
      .update({
        progress: courseProgress,
        last_accessed_lesson_id: quiz.lesson.id,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    res.json({
      attempt,
      score,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      passingScore: quiz.passing_score
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to submit quiz' });
  }
});

// Get lessons for a course (OLD ENDPOINT - keeping for backward compatibility)
app.get('/api/courses/:id/lessons', verifyToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course to view lessons' });
    }

    // Get all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('day_number', { ascending: true });

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`\n=== LESSONS FETCHED ===`);
    console.log(`Course ID: ${courseId}`);
    console.log(`Number of lessons: ${lessons?.length || 0}`);
    if (lessons && lessons.length > 0) {
      console.log(`First lesson columns:`, Object.keys(lessons[0]));
      console.log(`First lesson sample:`, {
        id: lessons[0].id,
        day_number: lessons[0].day_number,
        title: lessons[0].title,
        has_video_url: lessons[0].video_url !== undefined,
        has_pdf_url: lessons[0].pdf_url !== undefined,
        video_url: lessons[0].video_url,
        pdf_url: lessons[0].pdf_url
      });
    }

    if (!lessons || lessons.length === 0) {
      console.log('No lessons found, returning empty array');
      return res.json([]);
    }

    // Check if lessons table has video_url/pdf_url columns directly
    const firstLesson = lessons[0];
    const hasDirectColumns = firstLesson.video_url !== undefined || firstLesson.pdf_url !== undefined;
    console.log(`Has direct columns (video_url/pdf_url): ${hasDirectColumns}`);

    // Get videos, PDFs, and quizzes for each lesson
    const lessonsWithContent = await Promise.all(
      lessons.map(async (lesson) => {
        let video = null;
        let pdf = null;
        let quizWithQuestions = null;

        // If lessons table has video_url/pdf_url directly, use those
        if (hasDirectColumns) {
          if (lesson.video_url) {
            video = {
              id: lesson.id,
              lesson_id: lesson.id,
              url: lesson.video_url,
              title: lesson.video_title || `Day ${lesson.day_number} Video`
            };
          }
          if (lesson.pdf_url) {
            pdf = {
              id: lesson.id,
              lesson_id: lesson.id,
              url: lesson.pdf_url,
              title: lesson.pdf_title || `Day ${lesson.day_number} PDF Notes`
            };
          }
        } else {
          // Try to get video for this lesson (if table exists)
          try {
            const { data: videoData, error: videoError } = await supabase
              .from('lesson_videos')
              .select('id, lesson_id, url, title')
              .eq('lesson_id', lesson.id)
              .maybeSingle();
            if (videoError) {
              console.log(`Video fetch error for lesson ${lesson.id}:`, videoError.message);
            }
            video = videoData || null;
            if (video) {
              console.log(`Found video for lesson ${lesson.id}:`, video.url);
            }
          } catch (err) {
            console.log(`lesson_videos table might not exist for lesson ${lesson.id}:`, err.message);
          }

          // Try to get PDF for this lesson (if table exists)
          try {
            const { data: pdfData, error: pdfError } = await supabase
              .from('lesson_pdfs')
              .select('id, lesson_id, url, title')
              .eq('lesson_id', lesson.id)
              .maybeSingle();
            if (pdfError) {
              console.log(`PDF fetch error for lesson ${lesson.id}:`, pdfError.message);
            }
            pdf = pdfData || null;
            if (pdf) {
              console.log(`Found PDF for lesson ${lesson.id}:`, pdf.url);
            }
          } catch (err) {
            console.log(`lesson_pdfs table might not exist for lesson ${lesson.id}:`, err.message);
          }
        }

        // Try to get quiz for this lesson (if table exists)
        try {
          const { data: quiz } = await supabase
            .from('lesson_quizzes')
            .select('id, lesson_id, title, passing_score')
            .eq('lesson_id', lesson.id)
            .maybeSingle();

          if (quiz) {
            // Get quiz questions with options
            try {
              const { data: questions } = await supabase
                .from('quiz_questions')
                .select('id, quiz_id, question_text, order_index, points')
                .eq('quiz_id', quiz.id)
                .order('order_index', { ascending: true });

              if (questions && questions.length > 0) {
                const questionsWithOptions = await Promise.all(
                  questions.map(async (question) => {
                    try {
                      const { data: options } = await supabase
                        .from('quiz_options')
                        .select('id, question_id, text, is_correct, order_index')
                        .eq('question_id', question.id)
                        .order('order_index', { ascending: true });

                      return {
                        ...question,
                        options: options || []
                      };
                    } catch (err) {
                      return {
                        ...question,
                        options: []
                      };
                    }
                  })
                );

                quizWithQuestions = {
                  ...quiz,
                  questions: questionsWithOptions
                };
              } else {
                quizWithQuestions = {
                  ...quiz,
                  questions: []
                };
              }
            } catch (err) {
              quizWithQuestions = {
                ...quiz,
                questions: []
              };
            }
          }
        } catch (err) {
          // Table might not exist, that's okay
        }

        const lessonResult = {
          id: lesson.id,
          course_id: lesson.course_id,
          day_number: lesson.day_number,
          title: lesson.title,
          description: lesson.description,
          video: video,
          pdf: pdf,
          quiz: quizWithQuestions
        };

        console.log(`Lesson ${lesson.day_number} result:`, {
          hasVideo: !!video,
          hasPdf: !!pdf,
          hasQuiz: !!quizWithQuestions,
          videoUrl: video?.url,
          pdfUrl: pdf?.url
        });

        return lessonResult;
      })
    );

    console.log(`\n=== RETURNING ${lessonsWithContent.length} LESSONS ===`);
    res.json(lessonsWithContent);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch lessons' });
  }
});

// ============================================
// COURSE CONTENT API ENDPOINTS
// ============================================

// Get day-based course structure for enrolled users
app.get('/api/courses/:id/days', verifyToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Get all lessons for this course, ordered by day_number
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    // Sort lessons by day_number (if exists) and order_index
    const sortedLessons = (lessons || []).sort((a, b) => {
      const dayA = a.day_number || 0;
      const dayB = b.day_number || 0;
      if (dayA !== dayB) {
        return dayA - dayB;
      }
      return (a.order_index || 0) - (b.order_index || 0);
    });

    // Get user progress for all lessons
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId);

    if (progressError) throw progressError;

    // Create progress map
    const progressMap = {};
    (progress || []).forEach(p => {
      progressMap[p.lesson_id] = p;
    });

    // Group lessons by day_number and attach progress
    const daysMap = {};
    sortedLessons.forEach(lesson => {
      const dayNum = lesson.day_number || 1;
      if (!daysMap[dayNum]) {
        daysMap[dayNum] = {
          day_number: dayNum,
          video: null,
          pdf: null,
          quiz: null,
          isCompleted: false,
          isUnlocked: false
        };
      }

      const lessonProgress = progressMap[lesson.id] || null;
      const lessonData = {
        ...lesson,
        progress: lessonProgress,
        isCompleted: lessonProgress?.completed || false
      };

      if (lesson.lesson_type === 'video') {
        daysMap[dayNum].video = lessonData;
      } else if (lesson.lesson_type === 'pdf') {
        daysMap[dayNum].pdf = lessonData;
      } else if (lesson.lesson_type === 'quiz') {
        daysMap[dayNum].quiz = lessonData;
        // Day is completed only if quiz is passed
        daysMap[dayNum].isCompleted = lessonProgress?.quiz_passed === true;
      }
    });

    // Convert daysMap to array and sort by day_number
    const days = Object.values(daysMap).sort((a, b) => a.day_number - b.day_number);

    // Determine which day numbers are completed (quiz passed)
    const completedDayNumbers = new Set(
      days.filter(d => d.isCompleted).map(d => d.day_number)
    );

    // Determine if each day is unlocked:
    // - Day 1 is always unlocked
    // - Day N is unlocked if Day N-1 is completed
    days.forEach(day => {
      if (day.day_number === 1) {
        day.isUnlocked = true;
      } else {
        const prevDayNumber = day.day_number - 1;
        day.isUnlocked = completedDayNumbers.has(prevDayNumber);
      }
    });

    res.json({
      days,
      totalDays: days.length,
      completedDays: days.filter(d => d.isCompleted).length
    });
  } catch (error) {
    console.error('Error fetching day-based course structure:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Failed to fetch course structure',
      details: error.details || error.hint || 'Unknown error'
    });
  }
});

// Get course structure (sections and lessons) for enrolled users
app.get('/api/courses/:id/structure', verifyToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Get sections with lessons
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (sectionsError) throw sectionsError;

    // Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (lessonsError) throw lessonsError;

    // Get user progress for all lessons
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId);

    if (progressError) throw progressError;

    // Create progress map
    const progressMap = {};
    (progress || []).forEach(p => {
      progressMap[p.lesson_id] = p;
    });

    // Helper function to check if lesson is unlocked
    const checkLessonUnlocked = (lesson, allLessons, progressMap) => {
      // First lesson is always unlocked
      if (lesson.order_index === 0) return true;

      // Find previous lesson in same section
      const previousLesson = allLessons.find(
        l => l.section_id === lesson.section_id && l.order_index === lesson.order_index - 1
      );

      if (!previousLesson) return true;

      // Check if previous lesson is completed
      const prevProgress = progressMap[previousLesson.id];
      if (!prevProgress) return false;

      // If previous lesson has a quiz, it must be passed
      if (previousLesson.lesson_type === 'quiz') {
        return prevProgress.quiz_passed === true;
      }

      // Otherwise, just check if completed
      return prevProgress.completed === true;
    };

    // Organize lessons by section
    const sectionsWithLessons = (sections || []).map(section => {
      const sectionLessons = (lessons || [])
        .filter(lesson => lesson.section_id === section.id)
        .map(lesson => {
          const lessonProgress = progressMap[lesson.id] || null;
          return {
            ...lesson,
            progress: lessonProgress,
            isCompleted: lessonProgress?.completed || false,
            isUnlocked: checkLessonUnlocked(lesson, lessons, progressMap)
          };
        });

      return {
        ...section,
        lessons: sectionLessons
      };
    });

    // Get lessons without sections (if any)
    const lessonsWithoutSections = (lessons || [])
      .filter(lesson => !lesson.section_id)
      .map(lesson => {
        const lessonProgress = progressMap[lesson.id] || null;
        return {
          ...lesson,
          progress: lessonProgress,
          isCompleted: lessonProgress?.completed || false,
          isUnlocked: checkLessonUnlocked(lesson, lessons, progressMap)
        };
      });

    res.json({
      sections: sectionsWithLessons,
      lessonsWithoutSections,
      totalLessons: lessons?.length || 0,
      completedLessons: Object.values(progressMap).filter(p => p.completed).length
    });
  } catch (error) {
    console.error('Error fetching course structure:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch course structure' });
  }
});

// Get lesson content (video, PDF, quiz)
app.get('/api/lessons/:id/content', verifyToken, async (req, res) => {
  try {
    const lessonId = req.params.id;

    // Get lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*, course:courses(id)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', lesson.course.id)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Get lesson content (video or PDF)
    let content = null;
    if (lesson.lesson_type === 'video' || lesson.lesson_type === 'pdf') {
      const { data: lessonContent, error: contentError } = await supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('content_type', lesson.lesson_type)
        .maybeSingle();

      if (!contentError) {
        content = lessonContent;
      }
    }

    // Get quiz if lesson type is quiz
    let quiz = null;
    if (lesson.lesson_type === 'quiz') {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (!quizError && quizData) {
        // Get questions
        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order_index', { ascending: true });

        if (!questionsError && questions) {
          // Get options for each question
          const questionsWithOptions = await Promise.all(
            questions.map(async (question) => {
              const { data: options } = await supabase
                .from('quiz_options')
                .select('*')
                .eq('question_id', question.id)
                .order('order_index', { ascending: true });

              return {
                ...question,
                options: options || []
              };
            })
          );

          quiz = {
            ...quizData,
            questions: questionsWithOptions
          };
        }
      }
    }

    // Get user progress for this lesson
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    res.json({
      lesson,
      content,
      quiz,
      progress: progress || null
    });
  } catch (error) {
    console.error('Error fetching lesson content:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch lesson content' });
  }
});

// Helper function to update enrollment progress
async function updateEnrollmentProgress(userId, courseId) {
  try {
    console.log(`🔄 Updating enrollment progress for user ${userId}, course ${courseId}`);
    
    // For day-based courses, compute progress based on completed quiz days.
    // Each day has exactly one quiz lesson; a day is completed when that quiz is passed.

    // 1) Get all quiz lessons (one per day)
    const { data: quizLessons, error: quizLessonsError } = await supabase
      .from('lessons')
      .select('id, day_number, lesson_type')
      .eq('course_id', courseId)
      .eq('lesson_type', 'quiz')
      .order('day_number', { ascending: true });

    if (quizLessonsError) {
      console.error('updateEnrollmentProgress: error fetching quiz lessons:', quizLessonsError);
      return;
    }

    const totalDays = quizLessons?.length || 0;
    console.log(`📊 Total quiz days: ${totalDays}`);

    if (totalDays === 0) {
      console.warn('⚠️ No quiz lessons found for course:', courseId);
      return;
    }

    // 2) Get progress records where quiz is passed
    const { data: passedProgress, error: passedError } = await supabase
      .from('user_progress')
      .select('lesson_id, quiz_passed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('quiz_passed', true);

    if (passedError) {
      console.error('updateEnrollmentProgress: error fetching passed quizzes:', passedError);
      return;
    }

    const completedDays = passedProgress?.length || 0;
    console.log(`✅ Completed quiz days: ${completedDays}`);

    const progressPercentage = totalDays > 0
      ? Math.round((completedDays / totalDays) * 100)
      : 0;

    console.log(`📈 Calculated progress: ${progressPercentage}% (${completedDays}/${totalDays} days)`);

    // Update enrollment
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({
        progress: progressPercentage,
        status: progressPercentage === 100 ? 'completed' : 'enrolled',
        completed_at: progressPercentage === 100 ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating enrollment:', updateError);
    } else {
      console.log(`✅ Enrollment progress updated successfully: ${progressPercentage}%`);
    }
  } catch (error) {
    console.error('❌ Error updating enrollment progress:', error);
  }
}

// Update lesson progress
app.post('/api/lessons/:id/progress', verifyToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const { videoWatched, pdfViewed, quizScore, quizPassed, totalQuestions, correctAnswers, answers } = req.body;

    // Get lesson and course
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*, course:courses(id)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', lesson.course.id)
      .maybeSingle();

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    // Get or create progress
    let { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const progressData = {
      user_id: req.user.id,
      course_id: lesson.course.id,
      lesson_id: lessonId,
      video_watched: videoWatched !== undefined ? videoWatched : (progress?.video_watched || false),
      pdf_viewed: pdfViewed !== undefined ? pdfViewed : (progress?.pdf_viewed || false),
      quiz_score: quizScore !== undefined ? quizScore : progress?.quiz_score,
      quiz_passed: quizPassed !== undefined ? quizPassed : (progress?.quiz_passed || false),
      quiz_attempts: progress ? (progress.quiz_attempts || 0) + (quizScore !== undefined ? 1 : 0) : (quizScore !== undefined ? 1 : 0),
      last_accessed_at: new Date().toISOString()
    };

    // Determine if lesson is completed
    let completed = false;
    if (lesson.lesson_type === 'video') {
      completed = progressData.video_watched;
    } else if (lesson.lesson_type === 'pdf') {
      completed = progressData.pdf_viewed;
    } else if (lesson.lesson_type === 'quiz') {
      completed = progressData.quiz_passed; // Quiz must be passed to complete
    }

    progressData.completed = completed;
    progressData.completed_at = completed ? new Date().toISOString() : null;

    // Calculate progress percentage
    if (lesson.lesson_type === 'quiz') {
      progressData.progress_percentage = progressData.quiz_score || 0;
    } else {
      progressData.progress_percentage = completed ? 100 : 0;
    }

    if (progress) {
      // Update existing progress
      const { data: updatedProgress, error: updateError } = await supabase
        .from('user_progress')
        .update(progressData)
        .eq('id', progress.id)
        .select()
        .single();

      if (updateError) throw updateError;
      progress = updatedProgress;
    } else {
      // Create new progress
      const { data: newProgress, error: insertError } = await supabase
        .from('user_progress')
        .insert(progressData)
        .select()
        .single();

      if (insertError) throw insertError;
      progress = newProgress;
    }

    // Update enrollment progress and last accessed lesson
    await updateEnrollmentProgress(req.user.id, lesson.course.id);
    await supabase
      .from('enrollments')
      .update({
        last_accessed_lesson_id: lessonId,
        last_accessed_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .eq('course_id', lesson.course.id);

    // Save quiz attempt if quiz was submitted
    if (quizScore !== undefined && lesson.lesson_type === 'quiz') {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (quizData) {
        await supabase
          .from('quiz_attempts')
          .insert({
            user_id: req.user.id,
            quiz_id: quizData.id,
            lesson_id: lessonId,
            score: quizScore,
            total_questions: totalQuestions || 0,
            correct_answers: correctAnswers || 0,
            passed: quizPassed || false,
            answers: answers || {}
          });
      }
    }

    res.json({ progress, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: error.message || 'Failed to update progress' });
  }
});

// Proxy endpoint to download PDF files (bypasses CORS)
app.get('/api/download-pdf', verifyToken, async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    console.log('📥 PDF download request:', { url, filename });
    
    if (!url) {
      console.error('❌ PDF URL is missing');
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    // Fetch the PDF from the external URL
    console.log('🔄 Fetching PDF from:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch PDF:', response.status, response.statusText);
      return res.status(response.status).json({ error: 'Failed to fetch PDF' });
    }

    // Get the PDF as a buffer
    const buffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);
    
    console.log('✅ PDF fetched successfully, size:', pdfBuffer.length, 'bytes');

    // Set headers to force download (not open in browser)
    const downloadFilename = filename || 'document.pdf';
    // Escape filename for Content-Disposition header
    const safeFilename = downloadFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Send the PDF
    console.log('📤 Sending PDF to client with download headers...');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

