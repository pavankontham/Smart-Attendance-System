-- Database Fixes and Improvements
-- Run this in your Supabase SQL Editor to fix inconsistencies and add missing features

-- 1. Fix data type inconsistencies between UUID and INTEGER
-- The users table uses UUID but some references use INTEGER
-- Update foreign key references to use UUID consistently

-- Drop existing foreign key constraints that use INTEGER
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE class_enrollments DROP CONSTRAINT IF EXISTS class_enrollments_student_id_fkey;
ALTER TABLE class_enrollments DROP CONSTRAINT IF EXISTS class_enrollments_approved_by_fkey;

-- Update classes table to use UUID for teacher_id
ALTER TABLE classes ALTER COLUMN teacher_id TYPE UUID USING teacher_id::text::uuid;

-- Update class_enrollments table to use UUID for student_id and approved_by
ALTER TABLE class_enrollments ALTER COLUMN student_id TYPE UUID USING student_id::text::uuid;
ALTER TABLE class_enrollments ALTER COLUMN approved_by TYPE UUID USING approved_by::text::uuid;

-- Re-add foreign key constraints with correct UUID references
ALTER TABLE classes ADD CONSTRAINT classes_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE class_enrollments ADD CONSTRAINT class_enrollments_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE class_enrollments ADD CONSTRAINT class_enrollments_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id);

-- 2. Update attendance table to match the new slot-based system
-- Drop the old attendance table and recreate with proper structure
DROP TABLE IF EXISTS attendance CASCADE;

CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 9),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
    marked_by VARCHAR(50) DEFAULT 'student' CHECK (marked_by IN ('student', 'teacher', 'face_recognition', 'instant_password')),
    attendance_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id, slot_number, attendance_date)
);

-- 3. Create instant attendance passwords table for quick attendance feature
CREATE TABLE IF NOT EXISTS instant_attendance_passwords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    password VARCHAR(10) NOT NULL,
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 9),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    valid_date DATE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, slot_number, valid_date)
);

-- 4. Create subjects table for better subject management
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert common subjects
INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH', 'Mathematics and related topics'),
('Physics', 'PHY', 'Physics and applied physics'),
('Chemistry', 'CHEM', 'Chemistry and chemical sciences'),
('Biology', 'BIO', 'Biology and life sciences'),
('Computer Science', 'CS', 'Computer science and programming'),
('English', 'ENG', 'English language and literature'),
('History', 'HIST', 'History and social studies'),
('Geography', 'GEO', 'Geography and earth sciences'),
('Economics', 'ECON', 'Economics and business studies'),
('Art', 'ART', 'Art and creative subjects')
ON CONFLICT (name) DO NOTHING;

-- 6. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_class ON attendance(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_slot_date ON attendance(slot_number, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_day_slot ON attendance(day_of_week, slot_number);
CREATE INDEX IF NOT EXISTS idx_instant_passwords_class_slot ON instant_attendance_passwords(class_id, slot_number);
CREATE INDEX IF NOT EXISTS idx_instant_passwords_expires ON instant_attendance_passwords(expires_at);
CREATE INDEX IF NOT EXISTS idx_timetable_class_day_slot ON timetable_slots(class_id, day_of_week, slot_number);

-- 7. Add updated_at triggers for new tables
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instant_passwords_updated_at
    BEFORE UPDATE ON instant_attendance_passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable RLS for new tables
ALTER TABLE instant_attendance_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for instant_attendance_passwords
CREATE POLICY "Teachers can manage passwords for their classes" ON instant_attendance_passwords
    FOR ALL USING (
        teacher_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Students can view active passwords for their classes" ON instant_attendance_passwords
    FOR SELECT USING (
        class_id IN (
            SELECT ce.class_id FROM class_enrollments ce
            WHERE ce.student_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()::TEXT
            )
            AND ce.status = 'approved'
        )
        AND is_active = true
        AND expires_at > NOW()
    );

-- 10. Create RLS policies for subjects (read-only for all users)
CREATE POLICY "All users can view subjects" ON subjects
    FOR SELECT USING (true);

-- 11. Update attendance RLS policies
CREATE POLICY "Students can view their own attendance" ON attendance
    FOR SELECT USING (
        student_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Teachers can view attendance for their classes" ON attendance
    FOR SELECT USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()::TEXT
            )
        )
    );

CREATE POLICY "Students can mark their own attendance" ON attendance
    FOR INSERT WITH CHECK (
        student_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Teachers can manage attendance for their classes" ON attendance
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()::TEXT
            )
        )
    );

-- 12. Fix timetable timing arrays (corrected from your schema)
CREATE OR REPLACE FUNCTION create_default_timetable(class_id_param INTEGER) RETURNS VOID AS $$
DECLARE
    day INTEGER;
    slot INTEGER;
    start_times TIME[] := ARRAY['09:00', '09:50', '10:50', '11:40', '12:30', '13:20', '14:10', '15:10', '16:00'];
    end_times TIME[] := ARRAY['09:50', '10:40', '11:40', '12:30', '13:20', '14:10', '15:00', '16:00', '16:50'];
BEGIN
    -- Create slots for Monday to Saturday (1-6)
    FOR day IN 1..6 LOOP
        FOR slot IN 1..9 LOOP
            -- Skip slot 3 (first recess after 2nd hour: 10:40-10:50)
            -- Skip slot 8 (lunch break: 15:00-15:10)
            IF slot NOT IN (3, 8) THEN
                INSERT INTO timetable_slots (class_id, day_of_week, start_time, end_time, slot_number)
                VALUES (class_id_param, day, start_times[slot], end_times[slot], slot)
                ON CONFLICT (class_id, day_of_week, slot_number) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 13. Function to generate instant attendance password
CREATE OR REPLACE FUNCTION generate_attendance_password() RETURNS VARCHAR(6) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 14. Function to clean up expired passwords
CREATE OR REPLACE FUNCTION cleanup_expired_passwords() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM instant_attendance_passwords 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 15. Create a view for easy attendance reporting
CREATE OR REPLACE VIEW attendance_report AS
SELECT 
    a.id,
    u.name as student_name,
    u.student_id,
    c.name as class_name,
    c.subject,
    a.slot_number,
    CASE a.day_of_week
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    a.attendance_date,
    a.status,
    a.marked_by,
    ts.start_time,
    ts.end_time,
    a.created_at
FROM attendance a
JOIN users u ON a.student_id = u.id
JOIN classes c ON a.class_id = c.id
LEFT JOIN timetable_slots ts ON (
    ts.class_id = a.class_id 
    AND ts.day_of_week = a.day_of_week 
    AND ts.slot_number = a.slot_number
)
ORDER BY a.attendance_date DESC, a.slot_number;

-- Success message
SELECT 'Database fixes completed successfully! All tables are now consistent and properly configured.' as message;
