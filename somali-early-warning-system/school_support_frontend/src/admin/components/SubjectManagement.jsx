import { useState, useEffect } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      const response = await api.get('/academics/subjects/');
      console.log('Subjects response:', response.data);
      
      // Handle different response formats
      let subjectsList = [];
      if (Array.isArray(response.data)) {
        subjectsList = response.data;
      } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
        subjectsList = response.data.subjects;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        subjectsList = response.data.results;
      }
      
      console.log('Setting subjects:', subjectsList);
      setSubjects(subjectsList);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      showToast.error('Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending subject data:', formData);
      const response = await api.post('/academics/subjects/', formData);
      console.log('Subject created:', response.data);
      showToast.success(`Subject "${formData.name}" created successfully!`);
      setShowModal(false);
      setFormData({ name: '' });
      fetchSubjects();
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      // Handle duplicate subject error
      if (err.response?.data?.name) {
        showToast.error(`Subject already exists: ${err.response.data.name[0]}`);
      } else {
        const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to create subject';
        showToast.error(errorMsg);
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Subject Management</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div key={subject.subject_id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">{subject.name}</span>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No subjects found</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all relative z-10">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Add Subject</h3>
              <p className="text-blue-100 text-sm mt-1">Create a new subject for the curriculum</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl"
                >
                  ✓ Create Subject
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
