import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { Clock, Calendar, BookOpen, Users, Coffee, Edit3 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { slot: 1, start: '09:00', end: '09:50', label: '9:00 - 9:50 AM' },
  { slot: 2, start: '09:50', end: '10:40', label: '9:50 - 10:40 AM' },
  { slot: 'break1', start: '10:40', end: '10:50', label: 'Break (10 min)', isBreak: true },
  { slot: 3, start: '10:50', end: '11:40', label: '10:50 - 11:40 AM' },
  { slot: 4, start: '11:40', end: '12:30', label: '11:40 AM - 12:30 PM' },
  { slot: 5, start: '12:30', end: '13:20', label: '12:30 - 1:20 PM' },
  { slot: 6, start: '13:20', end: '14:10', label: '1:20 - 2:10 PM' },
  { slot: 7, start: '14:10', end: '15:00', label: '2:10 - 3:00 PM' },
  { slot: 'break2', start: '15:00', end: '15:10', label: 'Break (10 min)', isBreak: true },
  { slot: 8, start: '15:10', end: '16:00', label: '3:10 - 4:00 PM' },
  { slot: 9, start: '16:00', end: '16:50', label: '4:00 - 4:50 PM' },
];

export default function TeacherTimetable() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch teacher's classes
      const { data: classesData, error: classesError } = await dbHelpers.getClassesByTeacher(currentUser.uid);
      if (classesError) {
        let errorMessage = classesError.message;
        if (errorMessage.includes('Database connection')) {
          errorMessage = 'Unable to connect to database. Please try again.';
        } else if (errorMessage.includes('Teacher not found')) {
          errorMessage = 'Teacher account not found. Please contact support.';
        }
        toast.error(errorMessage);
        setClasses([]);
      } else {
        setClasses(classesData || []);
      }

      // Fetch timetable
      const { data: timetableData, error: timetableError } = await dbHelpers.getTimetableByTeacher(currentUser.uid);
      if (timetableError) {
        console.error('Timetable error:', timetableError);
        let errorMessage = timetableError.message;
        if (errorMessage.includes('Database connection')) {
          errorMessage = 'Unable to load timetable. Please try again.';
        }
        toast.error(errorMessage);
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
      let errorMessage = 'Failed to load timetable data.';

      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again in a moment.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Timetable service not found. Please contact support.';
      }

      toast.error(errorMessage);
      setClasses([]);
      setTimetable({});
    } finally {
      setLoading(false);
    }
  }

  function handleSlotClick(dayIndex, slotNumber) {
    if (typeof slotNumber === 'string') return; // Skip break slots
    
    setSelectedSlot({
      day: dayIndex + 1, // 1-based for database
      dayName: DAYS[dayIndex],
      slot: slotNumber,
      timeLabel: TIME_SLOTS.find(t => t.slot === slotNumber)?.label
    });
    setShowAssignModal(true);
  }

  async function handleAssignClass(classId) {
    if (!classId) {
      toast.error('Please select a class');
      return;
    }

    if (!selectedSlot) {
      toast.error('No time slot selected');
      return;
    }

    try {
      const { error } = await dbHelpers.createTimetable({
        class_id: classId,
        day_of_week: selectedSlot.day,
        slot_number: selectedSlot.slot,
        teacher_firebase_id: currentUser.uid
      });

      if (error) {
        // Handle specific error cases
        let errorMessage = error.message;
        if (errorMessage.includes('Invalid class ID')) {
          errorMessage = 'Invalid class selected. Please try again.';
        } else if (errorMessage.includes('Day of week must be')) {
          errorMessage = 'Invalid day selected. Please try again.';
        } else if (errorMessage.includes('Slot number must be')) {
          errorMessage = 'Invalid time slot selected. Please try again.';
        } else if (errorMessage.includes('permission')) {
          errorMessage = 'You don\'t have permission to modify this class.';
        } else if (errorMessage.includes('Database connection')) {
          errorMessage = 'Connection error. Please try again in a moment.';
        }

        toast.error(errorMessage);
      } else {
        toast.success('Class assigned to timetable successfully!');
        setShowAssignModal(false);
        setSelectedSlot(null);
        fetchData(); // Refresh timetable
      }
    } catch (error) {
      console.error('Error assigning class:', error);
      let errorMessage = 'Failed to assign class to timetable.';

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }

      toast.error(errorMessage);
    }
  }

  function getSlotContent(dayIndex, slotNumber) {
    const key = `${dayIndex + 1}-${slotNumber}`;
    const slot = timetable[key];

    if (slot && slot.class) {
      return (
        <div className="h-full bg-blue-50 border-l-4 border-blue-500 p-2 hover:bg-blue-100 transition-colors cursor-pointer">
          <div className="text-sm font-semibold text-blue-900 truncate">{slot.class.name}</div>
          <div className="text-xs text-blue-700">{slot.class.subject}</div>
          <div className="text-xs text-blue-600 mt-1 flex items-center">
            <BookOpen className="h-3 w-3 mr-1" />
            <span>Class Assigned</span>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-200">
        <span className="text-gray-400 text-xs">Click to assign</span>
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Weekly Timetable</h1>
              <p className="text-indigo-100 text-lg">Manage your class schedule</p>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Schedule</h2>
            
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header Row */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  <div className="bg-gray-100 p-3 text-center font-semibold text-gray-700 rounded-lg">
                    Time
                  </div>
                  {DAYS.map((day) => (
                    <div key={day} className="bg-gray-100 p-3 text-center font-semibold text-gray-700 rounded-lg">
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
                          <div
                            onClick={() => handleSlotClick(dayIndex, timeSlot.slot)}
                            className="h-full"
                          >
                            {getSlotContent(dayIndex, timeSlot.slot)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Classes Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Classes</h3>
          {classes.length === 0 ? (
            <p className="text-gray-600">No classes created yet. Create a class first to assign to timetable.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <div key={classItem.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{classItem.name}</h4>
                      <p className="text-sm text-gray-600">{classItem.subject}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        {classItem.student_count || 0} students
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign Class Modal */}
        {showAssignModal && selectedSlot && (
          <AssignClassModal
            slot={selectedSlot}
            classes={classes}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignClass}
          />
        )}
      </div>
    </Layout>
  );
}

// Assign Class Modal Component
function AssignClassModal({ slot, classes, onClose, onAssign }) {
  const [selectedClassId, setSelectedClassId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }
    onAssign(parseInt(selectedClassId));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Assign Class</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-semibold">{slot.dayName}</div>
            <div>Slot {slot.slot}: {slot.timeLabel}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a class...</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Assign Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

