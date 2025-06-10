-- Migration script to update attendance table for slot-based attendance
-- Run this in your Supabase SQL Editor to update existing attendance table

-- First, backup existing attendance data
CREATE TABLE IF NOT EXISTS attendance_backup AS SELECT * FROM attendance;

-- Drop the existing attendance table
DROP TABLE IF EXISTS attendance CASCADE;

-- Create new attendance table with slot support
CREATE TABLE attendance (
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_slot ON attendance(slot_number, day_of_week);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Students can manage their own attendance" ON attendance
    FOR ALL USING (student_id = (SELECT id FROM users WHERE firebase_id = auth.uid()));

CREATE POLICY "Teachers can manage attendance for their classes" ON attendance
    FOR ALL USING (
        class_id IN (
            SELECT id FROM classes 
            WHERE teacher_id = (SELECT id FROM users WHERE firebase_id = auth.uid())
        )
    );

-- Migrate existing data (if any) - this assumes slot 1 for all existing records
-- You may need to adjust this based on your existing data
INSERT INTO attendance (student_id, class_id, slot_number, day_of_week, status, marked_by, attendance_date, created_at, updated_at)
SELECT 
    student_id,
    class_id,
    1 as slot_number, -- Default to slot 1
    EXTRACT(DOW FROM created_at) + 1 as day_of_week, -- Convert to 1-7 format
    status,
    marked_by,
    DATE(created_at) as attendance_date,
    created_at,
    updated_at
FROM attendance_backup
WHERE student_id IS NOT NULL AND class_id IS NOT NULL
ON CONFLICT (student_id, class_id, slot_number, attendance_date) DO NOTHING;

-- Drop backup table after successful migration (uncomment if migration is successful)
-- DROP TABLE attendance_backup;

COMMENT ON TABLE attendance IS 'Attendance records with slot-based tracking for 9 daily classes';
COMMENT ON COLUMN attendance.slot_number IS 'Time slot number (1-9) for the 9 daily class periods';
COMMENT ON COLUMN attendance.day_of_week IS 'Day of week (1=Monday, 2=Tuesday, ..., 7=Sunday)';
COMMENT ON COLUMN attendance.attendance_date IS 'Date of attendance (separate from timestamp for easier querying)';
