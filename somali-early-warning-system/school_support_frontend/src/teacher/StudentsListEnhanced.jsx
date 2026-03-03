import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/apiClient';
import { cache, CACHE_KEYS } from '../utils/cache';
import { useApiCall, LoadingSpinner, ErrorDisplay } from '../hooks/useApiCall';

export default function StudentsList() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const { loading: apiLoading, error: apiError, execute: executeApi, reset: resetApi } = useApiCall();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    await executeApi(async () => {
      // Check cache first
      const cachedClasses = cache.get(CACHE_KEYS.MY_CLASSES);
      if (cachedClasses) {
        setClasses(cachedClasses);
        return cachedClasses;
      }

      const res = await api.get("/academics/assignments/");
      const assignments = res.data.filter(a => a.teacher === user.user_id);
      const classRes = await api.get("/students/classrooms/");
      const classIds = [...new Set(assignments.map(a => a.classroom))];
      const filteredClasses = classRes.data.filter(cls => classIds.includes(cls.class_id));
      
      // Cache for 5 minutes
      cache.set(CACHE_KEYS.MY_CLASSES, filteredClasses, 5 * 60 * 1000);
      setClasses(filteredClasses);
      return filteredClasses;
    }, {
      retries: 2,
      onError: (error) => console.error('Failed to load classes:', error)
    });
  };

  const loadStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    await executeApi(async () => {
      // Check cache first
      const cacheKey = CACHE_KEYS.STUDENTS(selectedClass);
      const cachedStudents = cache.get(cacheKey);
      if (cachedStudents) {
        setStudents(cachedStudents);
        return cachedStudents;
      }

      const res = await api.get(`/students/?classroom=${selectedClass}`);
      const studentsData = res.data;
      
      // Cache for 3 minutes
      cache.set(cacheKey, studentsData, 3 * 60 * 1000);
      setStudents(studentsData);
      return studentsData;
    }, {
      retries: 2,
      onError: (error) => console.error('Failed to load students:', error)
    });
    setLoading(false);
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || apiLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">My Students</h1>
        <LoadingSpinner size="lg" text="Loading your classes and students..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Students</h1>

      <ErrorDisplay 
        error={apiError} 
        onRetry={() => {
          resetApi();
          if (selectedClass) {
            loadStudents();
          } else {
            loadClasses();
          }
        }}
        onDismiss={resetApi}
      />

      {/* Class Selector */}
      <div className="mb-6">
        <label className="block font-semibold mb-2 text-gray-700">Select Class</label>
        <select
          className="p-3 border rounded-lg w-full max-w-md bg-white"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Select Class --</option>
          {classes.map(cls => (
            <option key={cls.class_id} value={cls.class_id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search students by name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 border rounded-lg w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Students Grid */}
          {loading ? (
            <LoadingSpinner size="md" text="Loading students..." />
          ) : filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => (
                <div key={student.student_id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{student.full_name}</h3>
                      <p className="text-sm text-gray-600">ID: {student.admission_number}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Email:</span> {student.email || 'Not provided'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Phone:</span> {student.phone_number || 'Not provided'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/teacher/attendance', { 
                        state: { preSelectedStudent: student.student_id } 
                      })}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Take Attendance
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/student-details/${student.student_id}`)}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">No students found</p>
              <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}