-- Create school_applications table
CREATE TABLE IF NOT EXISTS school_applications (
  id SERIAL PRIMARY KEY,
  institution_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  institution_type VARCHAR(50) NOT NULL CHECK (institution_type IN ('primary_school', 'secondary_school', 'college_university', 'ngo', 'other')),
  number_of_students INTEGER NOT NULL,
  grade_levels VARCHAR(255) NOT NULL,
  interest_reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_school_applications_status ON school_applications(status);
CREATE INDEX IF NOT EXISTS idx_school_applications_created_at ON school_applications(created_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row update
CREATE TRIGGER update_school_applications_updated_at 
    BEFORE UPDATE ON school_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();