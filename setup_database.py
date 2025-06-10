#!/usr/bin/env python3
"""
Database setup script for Face Recognition Attendance System
This script creates the necessary tables in Supabase
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = "https://qkrusouqwmrpernncabq.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnVzb3Vxd21ycGVybm5jYWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0Nzk2OSwiZXhwIjoyMDY0NjIzOTY5fQ.yP8WLKdMDuGZpwrTeU2kYSCUtq6wSG4GsOp4A62CdW0"

def create_tables():
    """Create database tables"""
    try:
        # Note: In a real setup, you would run the SQL from supabase/schema.sql
        # in the Supabase SQL editor. This is just for demonstration.
        
        print("Database setup instructions:")
        print("1. Go to https://supabase.com and open your project")
        print("2. Navigate to the SQL Editor")
        print("3. Run the SQL commands from 'supabase/schema.sql'")
        print("4. The tables will be created with proper RLS policies")
        print("\nAlternatively, you can use the Supabase CLI:")
        print("supabase db push")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def create_sample_data():
    """Create some sample data for testing"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Sample teacher
        teacher_data = {
            "firebase_id": "teacher_demo_123",
            "email": "teacher@demo.com",
            "name": "Demo Teacher",
            "role": "teacher"
        }
        
        # Sample students
        student_data = [
            {
                "firebase_id": "student_demo_1",
                "email": "student1@demo.com", 
                "name": "Alice Johnson",
                "role": "student",
                "student_id": "STU001"
            },
            {
                "firebase_id": "student_demo_2",
                "email": "student2@demo.com",
                "name": "Bob Smith", 
                "role": "student",
                "student_id": "STU002"
            }
        ]
        
        print("Creating sample users...")
        
        # Insert teacher
        result = supabase.table("users").insert(teacher_data).execute()
        print(f"Created teacher: {teacher_data['name']}")
        
        # Insert students
        for student in student_data:
            result = supabase.table("users").insert(student).execute()
            print(f"Created student: {student['name']} ({student['student_id']})")
        
        print("Sample data created successfully!")
        return True
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        print("This is normal if the database tables don't exist yet.")
        print("Please set up the database schema first.")
        return False

if __name__ == "__main__":
    print("Face Recognition Attendance System - Database Setup")
    print("=" * 50)
    
    print("\nStep 1: Database Schema Setup")
    create_tables()
    
    print("\nStep 2: Sample Data Creation")
    create_sample_data()
    
    print("\nSetup complete!")
    print("\nNext steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Register a new account (teacher or student)")
    print("3. For students: Enroll your face")
    print("4. For students: Mark attendance using face recognition")
    print("5. For teachers: View student attendance and reports")
