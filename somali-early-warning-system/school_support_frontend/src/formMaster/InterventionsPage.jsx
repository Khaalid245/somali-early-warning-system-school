import { useState, useEffect } from 'react';
import api from '../api/apiClient';
import InterventionManagement from './components/InterventionManagement';
import { showToast } from '../utils/toast';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function InterventionsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await api.get('/students/');
      console.log('Students loaded:', res.data);
      // Handle both array and object responses
      const studentsData = Array.isArray(res.data) ? res.data : (res.data.results || []);
      console.log('Students array:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
      showToast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={logout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Student Intervention & Progress Tracking
              </h1>
              <p className="mt-2 text-gray-600">
                Record meetings, track progress, and manage student interventions
              </p>
            </div>

            {/* Main Content */}
            <InterventionManagement students={students} />
          </div>
        </main>
      </div>
    </div>
  );
}
