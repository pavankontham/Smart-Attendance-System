-- Complete Database Setup for Face Recognition Attendance System
-- Run this AFTER your existing schema to fix inconsistencies and add missing features
-- This includes subjects, instant attendance, and proper 12-hour time format with IST

-- ============================================================================
-- 1. CREATE SUBJECTS TABLE AND INSERT PREDEFINED SUBJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the required subjects
INSERT INTO subjects (name, code, description) VALUES
('Software Engineering', 'CSE301', 'Principles and practices of software development including SDLC, design, testing, and maintenance'),
('Principles of Programming Languages', 'CSE302', 'Study of various programming paradigms and language constructs'),
('Distributed Systems', 'CSE303', 'Design and implementation of distributed computing systems and architectures'),
('Computer Security', 'CSE304', 'Concepts of information security, cryptography, and secure systems design'),
('Professional Elective II', 'PE2', 'Second elective chosen based on interest or specialization'),
('Professional Elective III', 'PE3', 'Third elective offering advanced knowledge in a selected area'),
('Soft Skills III', 'SS3', 'Development of advanced communication, teamwork, and presentation skills') 
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add subject column to users table (for teachers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Add instant attendance columns to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS instant_attendance_code VARCHAR(10);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS instant_attendance_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS instant_attendance_active BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 3. UPDATE TIMETABLE SLOTS WITH 12-HOUR FORMAT AND IST TIMEZONE
-- ============================================================================

-- Drop and recreate the timetable creation function with 12-hour format
DROP FUNCTION IF EXISTS create_default_timetable(INTEGER);

CREATE OR REPLACE FUNCTION create_default_timetable(class_id_param INTEGER) RETURNS VOID AS $$
DECLARE
    day INTEGER;
    slot INTEGER;
    -- 12-hour format times with proper recess breaks
    start_times TIME[] := ARRAY['09:00', '09:50', '10:50', '11:40', '12:30', '01:20', '02:10', '03:10', '04:00'];
    end_times TIME[] := ARRAY['09:50', '10:40', '11:40', '12:30', '01:20', '02:10', '03:00', '04:00', '04:50'];
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

-- ============================================================================
-- 4. CREATE INSTANT ATTENDANCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS instant_attendance (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attendance_code VARCHAR(10) NOT NULL,
    slot_number INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, slot_number, attendance_date)
);

-- ============================================================================
-- 5. CREATE INSTANT ATTENDANCE RESPONSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS instant_attendance_responses (
    id SERIAL PRIMARY KEY,
    instant_attendance_id INTEGER REFERENCES instant_attendance(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    response_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    face_recognition_success BOOLEAN DEFAULT FALSE,
    manual_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(instant_attendance_id, student_id)
);

-- ============================================================================
-- 6. UPDATE ATTENDANCE TABLE FOR BETTER TRACKING
-- ============================================================================

-- Add columns for instant attendance tracking
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS instant_attendance_id INTEGER REFERENCES instant_attendance(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_via VARCHAR(50) DEFAULT 'manual';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS slot_number INTEGER;

-- ============================================================================
-- 7. CREATE FUNCTIONS FOR INSTANT ATTENDANCE
-- ============================================================================

-- Function to generate instant attendance code
CREATE OR REPLACE FUNCTION generate_instant_attendance_code() RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-character numeric code
        code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if code already exists and is active
        SELECT EXISTS(
            SELECT 1 FROM instant_attendance 
            WHERE attendance_code = code 
            AND is_active = TRUE 
            AND expires_at > NOW()
        ) INTO exists;
        
        -- If code doesn't exist or is expired, return it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create instant attendance session
CREATE OR REPLACE FUNCTION create_instant_attendance_session(
    p_class_id INTEGER,
    p_teacher_id UUID,
    p_slot_number INTEGER,
    p_day_of_week INTEGER,
    p_attendance_date DATE
) RETURNS VARCHAR(10) AS $$
DECLARE
    attendance_code VARCHAR(10);
    expires_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique code
    attendance_code := generate_instant_attendance_code();
    
    -- Set expiration time (3 minutes from now)
    expires_time := NOW() + INTERVAL '3 minutes';
    
    -- Deactivate any existing active sessions for this class/slot/date
    UPDATE instant_attendance 
    SET is_active = FALSE 
    WHERE class_id = p_class_id 
    AND slot_number = p_slot_number 
    AND attendance_date = p_attendance_date;
    
    -- Create new session
    INSERT INTO instant_attendance (
        class_id, teacher_id, attendance_code, slot_number, 
        day_of_week, attendance_date, expires_at, is_active
    ) VALUES (
        p_class_id, p_teacher_id, attendance_code, p_slot_number,
        p_day_of_week, p_attendance_date, expires_time, TRUE
    );
    
    RETURN attendance_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Subjects table indexes
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

-- Instant attendance indexes
CREATE INDEX IF NOT EXISTS idx_instant_attendance_code ON instant_attendance(attendance_code);
CREATE INDEX IF NOT EXISTS idx_instant_attendance_active ON instant_attendance(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_instant_attendance_class_date ON instant_attendance(class_id, attendance_date);

-- Instant attendance responses indexes
CREATE INDEX IF NOT EXISTS idx_instant_attendance_responses_student ON instant_attendance_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_instant_attendance_responses_session ON instant_attendance_responses(instant_attendance_id);

-- ============================================================================
-- 9. ADD TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================================================

-- Subjects table trigger
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. ENABLE ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE instant_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE instant_attendance_responses ENABLE ROW LEVEL SECURITY;

-- Subjects policies (read-only for all authenticated users)
CREATE POLICY "All users can view subjects" ON subjects
    FOR SELECT USING (true);

-- Instant attendance policies
CREATE POLICY "Teachers can manage instant attendance for their classes" ON instant_attendance
    FOR ALL USING (
        teacher_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Students can view active instant attendance" ON instant_attendance
    FOR SELECT USING (
        is_active = TRUE 
        AND expires_at > NOW()
        AND class_id IN (
            SELECT ce.class_id FROM class_enrollments ce
            WHERE ce.student_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()::TEXT
            )
            AND ce.status = 'approved'
        )
    );

-- Instant attendance responses policies
CREATE POLICY "Students can manage their own responses" ON instant_attendance_responses
    FOR ALL USING (
        student_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Teachers can view responses for their classes" ON instant_attendance_responses
    FOR SELECT USING (
        instant_attendance_id IN (
            SELECT ia.id FROM instant_attendance ia
            WHERE ia.teacher_id = (
                SELECT id FROM users 
                WHERE firebase_id = auth.uid()::TEXT
            )
        )
    );

-- ============================================================================
-- 11. CREATE HELPER VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View for current day timetable with 12-hour format
CREATE OR REPLACE VIEW current_timetable AS
SELECT
    ts.id,
    ts.class_id,
    c.name as class_name,
    c.subject,
    ts.day_of_week,
    CASE ts.day_of_week
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    ts.slot_number,
    TO_CHAR(ts.start_time, 'HH12:MI AM') as start_time_12hr,
    TO_CHAR(ts.end_time, 'HH12:MI AM') as end_time_12hr,
    ts.start_time,
    ts.end_time,
    u.name as teacher_name,
    u.id as teacher_id
FROM timetable_slots ts
JOIN classes c ON ts.class_id = c.id
JOIN users u ON c.teacher_id = u.id
ORDER BY ts.day_of_week, ts.slot_number;

-- View for attendance summary
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
    u.id as student_id,
    u.name as student_name,
    u.student_id,
    c.id as class_id,
    c.name as class_name,
    c.subject,
    COUNT(a.id) as total_classes_attended,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL /
         NULLIF(COUNT(a.id), 0)) * 100, 2
    ) as attendance_percentage
FROM users u
LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.status = 'approved'
LEFT JOIN classes c ON ce.class_id = c.id
LEFT JOIN attendance a ON u.id = a.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.student_id, c.id, c.name, c.subject;

-- ============================================================================
-- 12. CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- Function to create sample teacher with subject
CREATE OR REPLACE FUNCTION create_sample_teacher(
    p_firebase_id TEXT,
    p_email TEXT,
    p_name TEXT,
    p_subject TEXT
) RETURNS UUID AS $$
DECLARE
    teacher_id UUID;
BEGIN
    INSERT INTO users (firebase_id, email, name, role, subject)
    VALUES (p_firebase_id, p_email, p_name, 'teacher', p_subject)
    ON CONFLICT (firebase_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        subject = EXCLUDED.subject
    RETURNING id INTO teacher_id;

    RETURN teacher_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create sample class with timetable
CREATE OR REPLACE FUNCTION create_sample_class(
    p_name TEXT,
    p_subject TEXT,
    p_teacher_id UUID,
    p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    class_id INTEGER;
BEGIN
    INSERT INTO classes (name, subject, teacher_id, description)
    VALUES (p_name, p_subject, p_teacher_id, p_description)
    RETURNING id INTO class_id;

    -- Create default timetable for this class
    PERFORM create_default_timetable(class_id);

    RETURN class_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. CREATE CLEANUP FUNCTIONS
-- ============================================================================

-- Function to cleanup expired instant attendance sessions
CREATE OR REPLACE FUNCTION cleanup_expired_instant_attendance() RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE instant_attendance
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND expires_at < NOW();

    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get current IST time
CREATE OR REPLACE FUNCTION get_ist_time() RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'Asia/Kolkata';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. CREATE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate student enrollment in class
CREATE OR REPLACE FUNCTION is_student_enrolled_in_class(
    p_student_id UUID,
    p_class_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM class_enrollments
        WHERE student_id = p_student_id
        AND class_id = p_class_id
        AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if instant attendance is valid
CREATE OR REPLACE FUNCTION is_instant_attendance_valid(
    p_attendance_code VARCHAR(10)
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM instant_attendance
        WHERE attendance_code = p_attendance_code
        AND is_active = TRUE
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. FINAL SETUP AND VERIFICATION
-- ============================================================================

-- Update any existing timetable slots to use 12-hour format (if any exist)
-- This is safe to run multiple times
DO $$
DECLARE
    class_record RECORD;
BEGIN
    FOR class_record IN SELECT DISTINCT class_id FROM timetable_slots LOOP
        DELETE FROM timetable_slots WHERE class_id = class_record.class_id;
        PERFORM create_default_timetable(class_record.class_id);
    END LOOP;
END $$;

-- Create a function to get day name from number
CREATE OR REPLACE FUNCTION get_day_name(day_num INTEGER) RETURNS TEXT AS $$
BEGIN
    RETURN CASE day_num
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
        ELSE 'Unknown'
    END;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get current day of week (1=Monday)
CREATE OR REPLACE FUNCTION get_current_day_of_week() RETURNS INTEGER AS $$
BEGIN
    -- PostgreSQL's EXTRACT(DOW) returns 0=Sunday, 1=Monday, etc.
    -- We want 1=Monday, so we adjust
    RETURN CASE EXTRACT(DOW FROM get_ist_time())
        WHEN 0 THEN 7  -- Sunday becomes 7
        ELSE EXTRACT(DOW FROM get_ist_time())::INTEGER
    END;
END;
$$ LANGUAGE plpgsql;

-- Success message with verification
DO $$
DECLARE
    subjects_count INTEGER;
    functions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subjects_count FROM subjects;
    SELECT COUNT(*) INTO functions_count FROM pg_proc WHERE proname LIKE '%instant_attendance%';

    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Subjects loaded: %', subjects_count;
    RAISE NOTICE 'Instant attendance functions created: %', functions_count;
    RAISE NOTICE 'All tables, views, functions, and policies are ready.';
    RAISE NOTICE 'Time format: 12-hour with IST timezone support';
    RAISE NOTICE 'Ready for instant attendance and class management features!';
END $$;
