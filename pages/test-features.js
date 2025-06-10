import { useState } from 'react';
import { dbHelpers } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function TestFeatures() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runTests() {
    setLoading(true);
    setTestResults([]);
    const results = [];

    try {
      // Test 1: Get all subjects
      results.push({ test: 'Get Subjects', status: 'running' });
      setTestResults([...results]);
      
      const { data: subjects, error: subjectsError } = await dbHelpers.getAllSubjects();
      if (subjectsError) {
        results[results.length - 1] = { test: 'Get Subjects', status: 'failed', error: subjectsError.message };
      } else {
        results[results.length - 1] = { test: 'Get Subjects', status: 'passed', data: subjects };
      }
      setTestResults([...results]);

      // Test 2: Create a test class
      results.push({ test: 'Create Class', status: 'running' });
      setTestResults([...results]);
      
      const { data: classData, error: classError } = await dbHelpers.createClass({
        name: 'Test Mathematics Class',
        subject: 'Mathematics',
        description: 'Test class for verification',
        teacher_firebase_id: 'test-teacher-123'
      });
      
      if (classError) {
        results[results.length - 1] = { test: 'Create Class', status: 'failed', error: classError.message };
      } else {
        results[results.length - 1] = { test: 'Create Class', status: 'passed', data: classData };
      }
      setTestResults([...results]);

      // Test 3: Get teacher classes
      results.push({ test: 'Get Teacher Classes', status: 'running' });
      setTestResults([...results]);
      
      const { data: teacherClasses, error: teacherError } = await dbHelpers.getClassesByTeacher('test-teacher-123');
      if (teacherError) {
        results[results.length - 1] = { test: 'Get Teacher Classes', status: 'failed', error: teacherError.message };
      } else {
        results[results.length - 1] = { test: 'Get Teacher Classes', status: 'passed', data: teacherClasses };
      }
      setTestResults([...results]);

      // Test 4: Create timetable
      if (classData && classData.id) {
        results.push({ test: 'Create Timetable', status: 'running' });
        setTestResults([...results]);
        
        const { data: timetableData, error: timetableError } = await dbHelpers.createTimetable({
          class_id: classData.id,
          day_of_week: 1, // Monday
          slot_number: 1,
          teacher_firebase_id: 'test-teacher-123'
        });
        
        if (timetableError) {
          results[results.length - 1] = { test: 'Create Timetable', status: 'failed', error: timetableError.message };
        } else {
          results[results.length - 1] = { test: 'Create Timetable', status: 'passed', data: timetableData };
        }
        setTestResults([...results]);
      }

      // Test 5: Get teacher timetable
      results.push({ test: 'Get Teacher Timetable', status: 'running' });
      setTestResults([...results]);
      
      const { data: timetable, error: timetableGetError } = await dbHelpers.getTimetableByTeacher('test-teacher-123');
      if (timetableGetError) {
        results[results.length - 1] = { test: 'Get Teacher Timetable', status: 'failed', error: timetableGetError.message };
      } else {
        results[results.length - 1] = { test: 'Get Teacher Timetable', status: 'passed', data: timetable };
      }
      setTestResults([...results]);

    } catch (error) {
      results.push({ test: 'General Error', status: 'failed', error: error.message });
      setTestResults([...results]);
    }

    setLoading(false);
  }

  function getStatusColor(status) {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Feature Testing Dashboard</h1>
          
          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                
                {result.error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                
                {result.data && (
                  <div className="text-gray-600 text-sm bg-gray-50 p-2 rounded">
                    <strong>Result:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {testResults.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Click "Run All Tests" to test the class and timetable functionality
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
