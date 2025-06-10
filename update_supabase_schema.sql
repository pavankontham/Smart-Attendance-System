-- Update Supabase schema to include class management tables
-- Run this in Supabase SQL Editor

-- First, drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS timetable_slots CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS face_encodings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with updated structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    student_id TEXT UNIQUE,
    subject TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create face_encodings table
CREATE TABLE face_encodings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    encoding JSONB NOT NULL,
    enrolled_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create classes table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    class_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_enrollments table
CREATE TABLE class_enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES users(id),
    UNIQUE(class_id, student_id)
);

-- Create timetable_slots table
CREATE TABLE timetable_slots (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, day_of_week, slot_number)
);

-- Create attendance table (updated for slot-based attendance)
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'present',
    marked_by VARCHAR(50) DEFAULT 'student',
    attendance_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id, slot_number, attendance_date)
);

-- Create indexes for better performance
CREATE INDEX idx_users_firebase_id ON users(firebase_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_face_encodings_user_id ON face_encodings(user_id);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_timetable_slots_class_id ON timetable_slots(class_id);
CREATE INDEX idx_timetable_slots_day_time ON timetable_slots(day_of_week, start_time);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_slot ON attendance(slot_number, day_of_week);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate unique class codes
CREATE OR REPLACE FUNCTION generate_class_code() RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-character alphanumeric code
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = code) INTO exists;
        
        -- If code doesn't exist, return it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to set class code
CREATE OR REPLACE FUNCTION set_class_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code := generate_class_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_face_encodings_updated_at BEFORE UPDATE ON face_encodings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate class codes
CREATE TRIGGER trigger_set_class_code
    BEFORE INSERT ON classes
    FOR EACH ROW
    EXECUTE FUNCTION set_class_code();

-- Enable Row Level Security (RLS) - but make it permissive for service role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_encodings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for service role)
-- Users policies
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (true);

-- Face encodings policies
CREATE POLICY "Service role can manage face encodings" ON face_encodings FOR ALL USING (true);

-- Classes policies
CREATE POLICY "Service role can manage classes" ON classes FOR ALL USING (true);

-- Class enrollments policies
CREATE POLICY "Service role can manage enrollments" ON class_enrollments FOR ALL USING (true);

-- Timetable slots policies
CREATE POLICY "Service role can manage timetable slots" ON timetable_slots FOR ALL USING (true);

-- Attendance policies
CREATE POLICY "Service role can manage attendance" ON attendance FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO users (firebase_id, email, name, role, subject) VALUES 
('demo-teacher-1', 'teacher1@example.com', 'Dr. John Smith', 'teacher', 'Software Engineering'),
('demo-teacher-2', 'teacher2@example.com', 'Prof. Jane Doe', 'teacher', 'Computer Science');

INSERT INTO users (firebase_id, email, name, role, student_id) VALUES 
('demo-student-1', 'student1@example.com', 'Alice Johnson', 'student', 'STU001'),
('demo-student-2', 'student2@example.com', 'Bob Wilson', 'student', 'STU002'),
('demo-student-3', 'student3@example.com', 'Charlie Brown', 'student', 'STU003');

-- Insert sample classes
INSERT INTO classes (name, subject, description, teacher_id) VALUES 
('Software Engineering Fundamentals', 'Software Engineering', 'Introduction to software engineering principles and practices', 1),
('Advanced Data Structures', 'Computer Science', 'Advanced algorithms and data structures', 2),
('Web Development', 'Computer Science', 'Full-stack web development with modern frameworks', 1),
('Database Systems', 'Computer Science', 'Database design and management systems', 2);
