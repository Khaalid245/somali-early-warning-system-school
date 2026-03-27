import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import InterventionManagement from './components/InterventionManagement';

export default function InterventionsPage() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Student Intervention & Progress Tracking
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Record meetings, track progress, and manage student interventions
              </p>
            </div>
            <InterventionManagement />
          </div>
        </main>
      </div>
    </div>
  );
}
