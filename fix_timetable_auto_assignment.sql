-- Fix Automatic Timetable Assignment Issue
-- Run this in your Supabase SQL Editor to clean up automatically created timetable slots

-- ============================================================================
-- 1. REMOVE ALL AUTOMATICALLY CREATED TIMETABLE SLOTS
-- ============================================================================

-- This will remove all existing timetable slots so teachers can assign them manually
-- WARNING: This will delete all current timetable assignments!
-- Only run this if you want to start fresh with manual timetable assignment

DELETE FROM timetable_slots;

-- ============================================================================
-- 2. DISABLE AUTOMATIC TIMETABLE CREATION FUNCTION
-- ============================================================================

-- Update the function to do nothing (empty slots will be created manually by teachers)
CREATE OR REPLACE FUNCTION create_default_timetable(class_id_param INTEGER) RETURNS VOID AS $$
BEGIN
    -- Do nothing - let teachers assign timetable slots manually
    RAISE NOTICE 'Timetable creation disabled. Teachers should assign slots manually for class %', class_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ALTERNATIVE: CREATE EMPTY TIMETABLE STRUCTURE (OPTIONAL)
-- ============================================================================

-- If you want to create empty slots that teachers can assign to, uncomment this:
/*
CREATE OR REPLACE FUNCTION create_empty_timetable_structure(class_id_param INTEGER) RETURNS VOID AS $$
DECLARE
    day INTEGER;
    slot INTEGER;
    start_times TIME[] := ARRAY['09:00', '09:50', '10:50', '11:40', '12:30', '13:20', '14:10', '15:10', '16:00'];
    end_times TIME[] := ARRAY['09:50', '10:40', '11:40', '12:30', '13:20', '14:10', '15:00', '16:00', '16:50'];
BEGIN
    -- Create empty time slots (no class assigned) for Monday to Saturday (1-6)
    FOR day IN 1..6 LOOP
        FOR slot IN 1..9 LOOP
            -- Only insert if slot doesn't exist
            INSERT INTO timetable_slots (class_id, day_of_week, start_time, end_time, slot_number)
            VALUES (NULL, day, start_times[slot], end_times[slot], slot)
            ON CONFLICT (class_id, day_of_week, slot_number) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Created empty timetable structure for manual assignment';
END;
$$ LANGUAGE plpgsql;
*/

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Check remaining timetable slots
SELECT 
    COUNT(*) as total_slots,
    COUNT(DISTINCT class_id) as classes_with_slots
FROM timetable_slots;

-- Check classes without timetable slots
SELECT 
    c.id,
    c.name,
    c.subject,
    u.name as teacher_name
FROM classes c
LEFT JOIN users u ON c.teacher_id = u.id
LEFT JOIN timetable_slots ts ON c.id = ts.class_id
WHERE ts.class_id IS NULL;

-- ============================================================================
-- INSTRUCTIONS FOR TEACHERS
-- ============================================================================

/*
After running this script:

1. Teachers should go to the Timetable page
2. Click on empty time slots to assign their classes
3. Each slot can be assigned to one class at a time
4. Teachers can only assign their own classes to time slots
5. The system will prevent conflicts and overlapping assignments

This gives teachers full control over when their classes are scheduled
instead of having all slots automatically filled.
*/
