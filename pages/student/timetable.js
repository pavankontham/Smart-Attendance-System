import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { Clock, BookOpen, Coffee, Calendar, Eye } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { slot: 1, start: '9:00 AM', end: '9:50 AM', label: '9:00 - 9:50 AM' },
  { slot: 2, start: '9:50 AM', end: '10:40 AM', label: '9:50 - 10:40 AM' },
  { slot: 'break1', start: '10:40 AM', end: '10:50 AM', label: 'Break (10 min)', isBreak: true },
  { slot: 3, start: '10:50 AM', end: '11:40 AM', label: '10:50 - 11:40 AM' },
  { slot: 4, start: '11:40 AM', end: '12:30 PM', label: '11:40 AM - 12:30 PM' },
  { slot: 5, start: '12:30 PM', end: '1:20 PM', label: '12:30 - 1:20 PM' },
  { slot: 6, start: '1:20 PM', end: '2:10 PM', label: '1:20 - 2:10 PM' },
  { slot: 7, start: '2:10 PM', end: '3:00 PM', label: '2:10 - 3:00 PM' },
  { slot: 'break2', start: '3:00 PM', end: '3:10 PM', label: 'Break (10 min)', isBreak: true },
  { slot: 8, start: '3:10 PM', end: '4:00 PM', label: '3:10 - 4:00 PM' },
  { slot: 9, start: '4:00 PM', end: '4:50 PM', label: '4:00 - 4:50 PM' }
];

export default function StudentTimetable() {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch student's enrolled classes
      const { data: classesData, error: classesError } = await dbHelpers.getClassesByStudent(currentUser.uid);
      if (classesError) {
        console.error('Classes error:', classesError);
        toast.error('Failed to load your classes');
        setEnrolledClasses([]);
      } else {
        setEnrolledClasses(classesData || []);
      }

      // Fetch timetable for student's classes
      const { data: timetableData, error: timetableError } = await dbHelpers.getTimetableByStudent(currentUser.uid);
      if (timetableError) {
        console.error('Timetable error:', timetableError);
        toast.error('Failed to load timetable');
        setTimetable({});
      } else {
        // Convert timetable data to a more usable format
        const timetableMap = {};
        (timetableData || []).forEach(slot => {
          const key = `${slot.day_of_week}-${slot.slot_number}`;
          timetableMap[key] = slot;
        });
        setTimetable(timetableMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load timetable data');
      setEnrolledClasses([]);
      setTimetable({});
    } finally {
      setLoading(false);
    }
  }

  function getSlotContent(dayIndex, slotNumber) {
    const key = `${dayIndex + 1}-${slotNumber}`;
    const slot = timetable[key];

    if (slot) {
      return (
        <div className="h-full bg-blue-50 border border-blue-200 rounded-lg p-2 hover:bg-blue-100 transition-colors cursor-default">
          <div className="text-xs font-semibold text-blue-800 truncate">
            {slot.class_name}
          </div>
          <div className="text-xs text-blue-600 truncate">
            {slot.subject}
          </div>
          <div className="text-xs text-blue-500 truncate">
            {slot.teacher_name}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-xs">Free</span>
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">My Timetable</h1>
              <p className="text-blue-100 text-lg">View your weekly class schedule</p>
            </div>
          </div>
        </div>

        {/* Enrolled Classes Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            Enrolled Classes ({enrolledClasses.length})
          </h2>
          {enrolledClasses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">You are not enrolled in any classes yet.</p>
              <p className="text-sm text-gray-500 mt-2">Visit "My Classes" to join available classes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledClasses.map((classItem) => (
                <div key={classItem.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900">{classItem.name}</h3>
                  <p className="text-sm text-blue-700">{classItem.subject}</p>
                  <p className="text-xs text-blue-600 mt-1">Teacher: {classItem.teacher_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
              Weekly Schedule
            </h2>
            
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header Row */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  <div className="p-3 text-center font-semibold text-gray-700 bg-gray-100 rounded-lg">
                    Time
                  </div>
                  {DAYS.map((day) => (
                    <div key={day} className="p-3 text-center font-semibold text-gray-700 bg-gray-100 rounded-lg">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div key={timeSlot.slot} className="grid grid-cols-7 gap-1 mb-1">
                    {/* Time Column */}
                    <div className={`p-3 text-center text-sm font-medium rounded-lg ${
                      timeSlot.isBreak 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {timeSlot.isBreak ? (
                        <div className="flex items-center justify-center">
                          <Coffee className="h-4 w-4 mr-1" />
                          <span className="text-xs">Break</span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold">Slot {timeSlot.slot}</div>
                          <div className="text-xs">{timeSlot.start} - {timeSlot.end}</div>
                        </div>
                      )}
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((day, dayIndex) => (
                      <div key={`${day}-${timeSlot.slot}`} className="h-20 rounded-lg overflow-hidden">
                        {timeSlot.isBreak ? (
                          <div className="h-full bg-orange-50 flex items-center justify-center">
                            <Coffee className="h-5 w-5 text-orange-400" />
                          </div>
                        ) : (
                          getSlotContent(dayIndex, timeSlot.slot)
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-700">Scheduled Class</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded"></div>
              <span className="text-sm text-gray-700">Break Time</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">Free Period</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
