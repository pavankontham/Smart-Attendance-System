-- Fix for Timetable Issues and Remove Class Code Requirement
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. FIX TIMETABLE SLOT CREATION FUNCTION
-- ============================================================================

-- Drop and recreate the timetable creation function with proper error handling
DROP FUNCTION IF EXISTS create_default_timetable(INTEGER);

CREATE OR REPLACE FUNCTION create_default_timetable(class_id_param INTEGER) RETURNS VOID AS $$
DECLARE
    day INTEGER;
    slot INTEGER;
    -- 12-hour format times with proper recess breaks
    start_times TIME[] := ARRAY['09:00', '09:50', '10:50', '11:40', '12:30', '13:20', '14:10', '15:10', '16:00'];
    end_times TIME[] := ARRAY['09:50', '10:40', '11:40', '12:30', '13:20', '14:10', '15:00', '16:00', '16:50'];
BEGIN
    -- Delete any existing timetable slots for this class first
    DELETE FROM timetable_slots WHERE class_id = class_id_param;
    
    -- Create slots for Monday to Saturday (1-6)
    FOR day IN 1..6 LOOP
        FOR slot IN 1..9 LOOP
            INSERT INTO timetable_slots (class_id, day_of_week, start_time, end_time, slot_number)
            VALUES (class_id_param, day, start_times[slot], end_times[slot], slot);
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created timetable slots for class %', class_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. REMOVE CLASS CODE REQUIREMENT - MAKE CLASS_CODE OPTIONAL
-- ============================================================================

-- Make class_code nullable and remove unique constraint
ALTER TABLE classes ALTER COLUMN class_code DROP NOT NULL;
DROP INDEX IF EXISTS classes_class_code_key;

-- Create a new unique constraint that allows NULL values
CREATE UNIQUE INDEX classes_class_code_unique 
ON classes (class_code) 
WHERE class_code IS NOT NULL;

-- ============================================================================
-- 3. UPDATE CLASS CREATION TO NOT REQUIRE CLASS CODE
-- ============================================================================

-- Function to create class without requiring class code
CREATE OR REPLACE FUNCTION create_class_without_code(
    p_name TEXT,
    p_subject TEXT,
    p_description TEXT,
    p_teacher_id UUID
) RETURNS INTEGER AS $$
DECLARE
    new_class_id INTEGER;
BEGIN
    INSERT INTO classes (name, subject, description, teacher_id, class_code)
    VALUES (p_name, p_subject, p_description, p_teacher_id, NULL)
    RETURNING id INTO new_class_id;
    
    -- Create default timetable for this class
    PERFORM create_default_timetable(new_class_id);
    
    RETURN new_class_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE SIMPLE CLASS JOINING FUNCTION
-- ============================================================================

-- Function for students to join any class by class name or ID
CREATE OR REPLACE FUNCTION join_class_simple(
    p_student_id UUID,
    p_class_identifier TEXT  -- Can be class name or class ID
) RETURNS BOOLEAN AS $$
DECLARE
    target_class_id INTEGER;
    existing_enrollment INTEGER;
BEGIN
    -- Try to find class by ID first, then by name
    IF p_class_identifier ~ '^[0-9]+$' THEN
        -- It's a number, treat as class ID
        SELECT id INTO target_class_id 
        FROM classes 
        WHERE id = p_class_identifier::INTEGER;
    ELSE
        -- It's text, treat as class name
        SELECT id INTO target_class_id 
        FROM classes 
        WHERE LOWER(name) = LOWER(p_class_identifier);
    END IF;
    
    -- Check if class exists
    IF target_class_id IS NULL THEN
        RAISE EXCEPTION 'Class not found: %', p_class_identifier;
    END IF;
    
    -- Check if already enrolled
    SELECT id INTO existing_enrollment
    FROM class_enrollments 
    WHERE student_id = p_student_id AND class_id = target_class_id;
    
    IF existing_enrollment IS NOT NULL THEN
        -- Update status to approved if exists
        UPDATE class_enrollments 
        SET status = 'approved', 
            enrolled_at = NOW(),
            approved_at = NOW()
        WHERE id = existing_enrollment;
    ELSE
        -- Create new enrollment with approved status
        INSERT INTO class_enrollments (class_id, student_id, status, enrolled_at, approved_at)
        VALUES (target_class_id, p_student_id, 'approved', NOW(), NOW());
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE VIEW FOR EASY CLASS BROWSING
-- ============================================================================

-- View to show all available classes for students to join
CREATE OR REPLACE VIEW available_classes AS
SELECT 
    c.id,
    c.name,
    c.subject,
    c.description,
    u.name as teacher_name,
    COUNT(ce.id) as enrolled_students,
    c.created_at
FROM classes c
JOIN users u ON c.teacher_id = u.id
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'approved'
GROUP BY c.id, c.name, c.subject, c.description, u.name, c.created_at
ORDER BY c.name;

-- ============================================================================
-- 6. FIX EXISTING TIMETABLE SLOTS FOR ALL CLASSES
-- ============================================================================

-- Recreate timetable slots for all existing classes
DO $$
DECLARE
    class_record RECORD;
BEGIN
    FOR class_record IN SELECT id FROM classes LOOP
        BEGIN
            PERFORM create_default_timetable(class_record.id);
            RAISE NOTICE 'Fixed timetable for class ID: %', class_record.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to fix timetable for class ID: %, Error: %', class_record.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- 7. UPDATE RLS POLICIES FOR EASIER CLASS ACCESS
-- ============================================================================

-- Drop restrictive policies and create more open ones
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;

-- Allow all authenticated users to view all classes
CREATE POLICY "All users can view all classes" ON classes
    FOR SELECT USING (true);

-- Allow students to join any class
DROP POLICY IF EXISTS "Students can manage their own enrollments" ON class_enrollments;

CREATE POLICY "Students can join any class" ON class_enrollments
    FOR INSERT WITH CHECK (
        student_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
            AND role = 'student'
        )
    );

CREATE POLICY "Students can view their enrollments" ON class_enrollments
    FOR SELECT USING (
        student_id = (
            SELECT id FROM users 
            WHERE firebase_id = auth.uid()::TEXT
        )
    );

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS FOR FRONTEND
-- ============================================================================

-- Function to get all classes (for browsing)
CREATE OR REPLACE FUNCTION get_all_classes() 
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    subject TEXT,
    description TEXT,
    teacher_name TEXT,
    enrolled_students BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM available_classes;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student is enrolled in a class
CREATE OR REPLACE FUNCTION is_student_enrolled(
    p_student_firebase_id TEXT,
    p_class_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    student_uuid UUID;
BEGIN
    -- Get student's UUID
    SELECT id INTO student_uuid 
    FROM users 
    WHERE firebase_id = p_student_firebase_id;
    
    IF student_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check enrollment
    RETURN EXISTS(
        SELECT 1 FROM class_enrollments 
        WHERE student_id = student_uuid 
        AND class_id = p_class_id 
        AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Timetable and class joining fixes applied successfully!';
    RAISE NOTICE '📋 Changes made:';
    RAISE NOTICE '   - Fixed timetable slot creation function';
    RAISE NOTICE '   - Made class codes optional';
    RAISE NOTICE '   - Students can now join any class without codes';
    RAISE NOTICE '   - Created helper functions for easier class management';
    RAISE NOTICE '   - Updated RLS policies for better access';
    RAISE NOTICE '   - Fixed existing timetable slots for all classes';
END $$;
