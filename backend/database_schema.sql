-- Class Management System Database Schema

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    class_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class enrollments table (many-to-many relationship between students and classes)
CREATE TABLE IF NOT EXISTS class_enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    UNIQUE(class_id, student_id)
);

-- Timetable slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 1=Monday, 2=Tuesday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_number INTEGER NOT NULL, -- 1-9 for the 9 daily slots
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, day_of_week, slot_number)
);

-- Attendance table (updated for slot-based attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL, -- 1-9 for the 9 daily slots
    day_of_week INTEGER NOT NULL, -- 1=Monday, 2=Tuesday, ..., 6=Saturday
    status VARCHAR(20) DEFAULT 'present', -- present, absent, late
    marked_by VARCHAR(50) DEFAULT 'student', -- student, teacher, face_recognition, instant_password
    attendance_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, slot_number, attendance_date) -- One attendance per student per class per slot per day
);

-- Update users table to include subject for teachers
ALTER TABLE users ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_day_time ON timetable_slots(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_slot ON attendance(slot_number, day_of_week);

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

-- Trigger to auto-generate class codes
CREATE OR REPLACE FUNCTION set_class_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code := generate_class_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_class_code
    BEFORE INSERT ON classes
    FOR EACH ROW
    EXECUTE FUNCTION set_class_code();

-- Function to create default timetable slots for a class
CREATE OR REPLACE FUNCTION create_default_timetable(class_id_param INTEGER) RETURNS VOID AS $$
DECLARE
    day INTEGER;
    slot INTEGER;
    start_times TIME[] := ARRAY['09:00', '09:50', '10:40', '11:40', '12:30', '13:20', '14:10', '15:10', '16:00'];
    end_times TIME[] := ARRAY['09:50', '10:40', '11:30', '12:30', '13:20', '14:10', '15:00', '16:00', '16:50'];
BEGIN
    -- Create slots for Monday to Saturday (1-6)
    FOR day IN 1..6 LOOP
        FOR slot IN 1..9 LOOP
            INSERT INTO timetable_slots (class_id, day_of_week, start_time, end_time, slot_number)
            VALUES (class_id_param, day, start_times[slot], end_times[slot], slot)
            ON CONFLICT (class_id, day_of_week, slot_number) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional)
-- INSERT INTO classes (name, subject, teacher_id, description) VALUES 
-- ('Mathematics 101', 'Mathematics', 1, 'Basic mathematics course'),
-- ('Physics 201', 'Physics', 1, 'Advanced physics concepts');

-- RLS (Row Level Security) policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy for classes: Teachers can manage their own classes, students can view classes they're enrolled in
CREATE POLICY "Teachers can manage their own classes" ON classes
    FOR ALL USING (teacher_id = (SELECT id FROM users WHERE firebase_id = auth.uid()));

CREATE POLICY "Students can view classes they're enrolled in" ON classes
    FOR SELECT USING (
        id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = (SELECT id FROM users WHERE firebase_id = auth.uid())
            AND status = 'approved'
        )
    );

-- Policy for class_enrollments
CREATE POLICY "Students can manage their own enrollments" ON class_enrollments
    FOR ALL USING (student_id = (SELECT id FROM users WHERE firebase_id = auth.uid()));

CREATE POLICY "Teachers can manage enrollments for their classes" ON class_enrollments
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (SELECT id FROM users WHERE firebase_id = auth.uid())
        )
    );

-- Policy for timetable_slots
CREATE POLICY "Teachers can manage timetables for their classes" ON timetable_slots
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (SELECT id FROM users WHERE firebase_id = auth.uid())
        )
    );

CREATE POLICY "Students can view timetables for their classes" ON timetable_slots
    FOR SELECT USING (
        class_id IN (
            SELECT ce.class_id FROM class_enrollments ce
            WHERE ce.student_id = (SELECT id FROM users WHERE firebase_id = auth.uid())
            AND ce.status = 'approved'
        )
    );

-- Policy for attendance
CREATE POLICY "Students can manage their own attendance" ON attendance
    FOR ALL USING (student_id = (SELECT id FROM users WHERE firebase_id = auth.uid()));

CREATE POLICY "Teachers can manage attendance for their classes" ON attendance
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes
            WHERE teacher_id = (SELECT id FROM users WHERE firebase_id = auth.uid())
        )
    );
