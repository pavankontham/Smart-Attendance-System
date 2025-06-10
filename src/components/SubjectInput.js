import { useState, useEffect, useRef } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';

const COMMON_SUBJECTS = [
  'Mathematics',
  'Physics', 
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Business Studies',
  'Art',
  'Music',
  'Physical Education',
  'Psychology',
  'Philosophy',
  'Political Science',
  'Sociology',
  'Statistics',
  'Engineering',
  'Medicine'
];

export default function SubjectInput({ 
  value, 
  onChange, 
  placeholder = "Enter subject name",
  className = "",
  required = false,
  existingSubjects = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Combine existing subjects from database with common subjects
  const allSubjects = [...new Set([...existingSubjects, ...COMMON_SUBJECTS])].sort();

  useEffect(() => {
    if (value) {
      const filtered = allSubjects.filter(subject =>
        subject.toLowerCase().includes(value.toLowerCase()) &&
        subject.toLowerCase() !== value.toLowerCase()
      );
      setFilteredSubjects(filtered.slice(0, 8)); // Limit to 8 suggestions
    } else {
      setFilteredSubjects(allSubjects.slice(0, 8));
    }
  }, [value, allSubjects]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  }

  function handleSubjectSelect(subject) {
    onChange(subject);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredSubjects.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
            {filteredSubjects.map((subject, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSubjectSelect(subject)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center"
              >
                <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                {subject}
              </button>
            ))}
          </div>
          
          {value && !allSubjects.some(s => s.toLowerCase() === value.toLowerCase()) && (
            <div className="border-t border-gray-200 py-2 px-4">
              <div className="text-xs text-gray-500 mb-1">Create new subject:</div>
              <button
                type="button"
                onClick={() => handleSubjectSelect(value)}
                className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + "{value}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
