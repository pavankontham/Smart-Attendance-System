-- Class Management System Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Add subject column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- 2. Create classes table
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

-- 3. Create class enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    UNIQUE(class_id, student_id)
);

-- 4. Create timetable slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, day_of_week, slot_number)
);

-- 5. Create attendance table (updated for slot-based attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL, -- 1-9 for the 9 daily slots
    day_of_week INTEGER NOT NULL, -- 1=Monday, 2=Tuesday, ..., 6=Saturday
    status VARCHAR(20) DEFAULT 'present',
    marked_by VARCHAR(50) DEFAULT 'student',
    attendance_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, slot_number, attendance_date)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_day_time ON timetable_slots(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(DATE(created_at));

-- 6. Function to generate unique class codes
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

-- 7. Trigger to auto-generate class codes
CREATE OR REPLACE FUNCTION set_class_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code := generate_class_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_class_code ON classes;
CREATE TRIGGER trigger_set_class_code
    BEFORE INSERT ON classes
    FOR EACH ROW
    EXECUTE FUNCTION set_class_code();

-- 8. Function to create default timetable slots for a class
CREATE OR REPLACE FUNCTION create_default_timetable(class_id_param INTEGER) RETURNS VOID AS $$
DECLARE
    day INTEGER;
    slot INTEGER;
    start_times TIME[] := ARRAY['09:00', '09:50', '10:50', '11:40', '12:30', '13:20', '14:10', '15:10', '16:00'];
    end_times TIME[] := ARRAY['09:50', '10:40', '11:40', '12:30', '13:20', '14:10', '15:00', '16:00', '16:50'];
BEGIN
    -- Create slots for Monday to Saturday (1-6)
    -- Skip slots 3, 8 as they will be assigned manually after breaks
    FOR day IN 1..6 LOOP
        FOR slot IN 1..9 LOOP
            INSERT INTO timetable_slots (class_id, day_of_week, start_time, end_time, slot_number)
            VALUES (class_id_param, day, start_times[slot], end_times[slot], slot)
            ON CONFLICT (class_id, day_of_week, slot_number) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies

-- Classes policies
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
CREATE POLICY "Teachers can manage their own classes" ON classes
    FOR ALL USING (
        teacher_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
CREATE POLICY "Students can view classes they're enrolled in" ON classes
    FOR SELECT USING (
        id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()
            )
            AND status = 'approved'
        )
    );

-- Class enrollments policies
DROP POLICY IF EXISTS "Students can manage their own enrollments" ON class_enrollments;
CREATE POLICY "Students can manage their own enrollments" ON class_enrollments
    FOR ALL USING (
        student_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON class_enrollments;
CREATE POLICY "Teachers can manage enrollments for their classes" ON class_enrollments
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()
            )
        )
    );

-- Timetable slots policies
DROP POLICY IF EXISTS "Teachers can manage timetables for their classes" ON timetable_slots;
CREATE POLICY "Teachers can manage timetables for their classes" ON timetable_slots
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Students can view timetables for their classes" ON timetable_slots;
CREATE POLICY "Students can view timetables for their classes" ON timetable_slots
    FOR SELECT USING (
        class_id IN (
            SELECT ce.class_id FROM class_enrollments ce
            WHERE ce.student_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()
            )
            AND ce.status = 'approved'
        )
    );

-- Success message
SELECT 'Database setup completed successfully!' as message;
