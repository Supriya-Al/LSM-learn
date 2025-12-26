-- Certificates Schema
-- This table stores certificate records for completed courses

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'GENERATED', 'REJECTED')),
  certificate_url TEXT, -- URL to the generated PDF certificate
  certificate_number TEXT UNIQUE, -- Unique certificate number
  issued_at TIMESTAMP WITH TIME ZONE,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who approved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id) -- One certificate per user per course
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment_id ON certificates(enrollment_id);

-- Enable Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificates
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON certificates;

CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage certificates"
  ON certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_certificates_updated_at ON certificates;
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_num TEXT;
BEGIN
  cert_num := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('certificate_seq')::TEXT, 6, '0');
  RETURN cert_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_seq START 1;


