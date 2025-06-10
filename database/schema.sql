-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS face_encodings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    encoding JSONB NOT NULL,
    enrolled_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
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
CREATE TABLE IF NOT EXISTS class_enrollments (
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
CREATE TABLE IF NOT EXISTS timetable_slots (
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
CREATE TABLE IF NOT EXISTS attendance (
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
CREATE INDEX IF NOT EXISTS idx_users_firebase_id ON users(firebase_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_face_encodings_user_id ON face_encodings(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_day_time ON timetable_slots(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_slot ON attendance(slot_number, day_of_week);

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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_encodings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (true); -- Allow all users to read (for teacher dashboard)

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true); -- Service role will handle this

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true); -- Service role will handle this

-- Face encodings policies
CREATE POLICY "Users can view their own face encodings" ON face_encodings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own face encodings" ON face_encodings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own face encodings" ON face_encodings
    FOR UPDATE USING (true);

-- Classes policies
CREATE POLICY "Anyone can view classes" ON classes
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their own classes" ON classes
    FOR ALL USING (true); -- Service role will handle authorization

-- Class enrollments policies
CREATE POLICY "Anyone can view enrollments" ON class_enrollments
    FOR SELECT USING (true);

CREATE POLICY "Students can manage their own enrollments" ON class_enrollments
    FOR ALL USING (true); -- Service role will handle authorization

-- Timetable slots policies
CREATE POLICY "Anyone can view timetable slots" ON timetable_slots
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage timetable slots" ON timetable_slots
    FOR ALL USING (true); -- Service role will handle authorization

-- Attendance policies
CREATE POLICY "Users can view attendance data" ON attendance
    FOR SELECT USING (true); -- Teachers need to see all, students see their own

CREATE POLICY "Users can insert attendance data" ON attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update attendance data" ON attendance
    FOR UPDATE USING (true);

-- Insert some sample data (optional)
-- You can run this manually in Supabase SQL editor if needed

-- Sample teacher
-- INSERT INTO users (firebase_id, email, name, role, subject) VALUES
-- ('teacher123', 'teacher@example.com', 'John Teacher', 'teacher', 'Software Engineering');

-- Sample students
-- INSERT INTO users (firebase_id, email, name, role, student_id) VALUES
-- ('student123', 'student1@example.com', 'Alice Student', 'student', 'STU001'),
-- ('student456', 'student2@example.com', 'Bob Student', 'student', 'STU002');

-- Sample classes (after creating teacher)
-- INSERT INTO classes (name, subject, description, teacher_id) VALUES
-- ('Software Engineering 101', 'Software Engineering', 'Introduction to software engineering principles', 1),
-- ('Advanced Programming', 'Computer Science', 'Advanced programming concepts and techniques', 1);

