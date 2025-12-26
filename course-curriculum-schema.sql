-- Course Curriculum Schema
-- This table stores day-by-day curriculum for courses

-- Add total_days column to courses table if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 30 CHECK (total_days >= 7 AND total_days <= 30);

-- Create course_curriculum table
CREATE TABLE IF NOT EXISTS course_curriculum (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  video_url TEXT,
  pdf_url TEXT,
  quiz_data JSONB, -- Stores quiz questions, options, correct answers, passing score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, day_number)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_course_curriculum_course_id ON course_curriculum(course_id);
CREATE INDEX IF NOT EXISTS idx_course_curriculum_day_number ON course_curriculum(course_id, day_number);

-- Enable Row Level Security
ALTER TABLE course_curriculum ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_curriculum
CREATE POLICY "Admins can view all curriculum"
  ON course_curriculum FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage curriculum"
  ON course_curriculum FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view curriculum for enrolled courses
CREATE POLICY "Users can view curriculum for enrolled courses"
  ON course_curriculum FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE course_id = course_curriculum.course_id
      AND user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_course_curriculum_updated_at
  BEFORE UPDATE ON course_curriculum
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


