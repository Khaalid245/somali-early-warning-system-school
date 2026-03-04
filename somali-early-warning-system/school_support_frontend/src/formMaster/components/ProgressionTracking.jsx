import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';
import { getUserFriendlyError, operationErrors } from '../../utils/errorMessages';
import TablePagination from '../../components/TablePagination';
import { TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';

export default function ProgressionTracking() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [casesPage, setCasesPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Fetch dashboard data (has all classroom students) and closed cases
      const [dashboardRes, casesRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get('/interventions/?status=closed')
      ]);

      const closedCases = Array.isArray(casesRes.data) ? casesRes.data : casesRes.data.results || [];
      const allStudents = dashboardRes.data.high_risk_students || [];
      
      // Add absent_count (days missed) to display
      const studentsWithAbsences = allStudents.map(s => ({
        ...s,
        days_missed: s.absent_count || 0
      }));

      // Calculate metrics from closed cases
      const successfulCases = closedCases.filter(c => c.progress_status === 'resolved').length;
      const totalClosed = closedCases.length;
      const successRate = totalClosed > 0 ? ((successfulCases / totalClosed) * 100).toFixed(1) : 0;

      // Calculate average resolution time
      const resolutionTimes = closedCases.map(c => {
        const created = new Date(c.created_at);
        const updated = new Date(c.updated_at);
        return Math.floor((updated - created) / (1000 * 60 * 60 * 24));
      });
      const avgResolution = resolutionTimes.length > 0 
        ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
        : 0;

      // Map students with their case history (show ALL students, not just 10)
      const studentProgress = studentsWithAbsences.map(student => {
        const studentCases = closedCases.filter(c => c.student === student.student__student_id);
        const hasImprovement = studentCases.some(c => 
          c.progress_status === 'resolved' || c.progress_status === 'improving'
        );
        
        return {
          name: student.student__full_name,
          student_id: student.student__student_id,
          casesCount: studentCases.length,
          hasImprovement,
          trend: hasImprovement ? 'improving' : 'stable',
          attendance_rate: student.attendance_rate,
          risk_level: student.risk_level,
          days_missed: student.days_missed
        };
      }); // Removed .slice(0, 10) to show ALL students

      setProgressData({
        successRate,
        avgResolution,
        totalClosed,
        successfulCases,
        closedCases,
        studentProgress,
        totalStudents: studentProgress.length,
        totalClosedCases: closedCases.length
      });
    } catch (err) {
      showToast.error(getUserFriendlyError(err) || 'Failed to load progression data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading progression data...</p>
        </div>
      </div>
    );
  }

  // Pagination logic
  const paginatedStudents = progressData?.studentProgress.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  
  const paginatedCases = progressData?.closedCases.slice(
    (casesPage - 1) * itemsPerPage,
    casesPage * itemsPerPage
  ) || [];

  const totalStudentPages = Math.ceil((progressData?.totalStudents || 0) / itemsPerPage);
  const totalCasesPages = Math.ceil((progressData?.totalClosedCases || 0) / itemsPerPage);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Success Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{progressData?.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Avg Resolution</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{progressData?.avgResolution} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl sm:text-3xl flex-shrink-0">✅</span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Successful Cases</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{progressData?.successfulCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl sm:text-3xl flex-shrink-0">📋</span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Closed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{progressData?.totalClosed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Progress Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Student Progress Over Time</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Student</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Risk Level</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Attendance</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Days Missed</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Cases</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Trend</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3">
                    <p className="font-medium text-sm text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      student.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                      student.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                      student.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {student.risk_level?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${
                      student.attendance_rate >= 80 ? 'text-green-600' :
                      student.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {student.attendance_rate}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${
                      student.days_missed >= 10 ? 'text-red-600' :
                      student.days_missed >= 5 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {student.days_missed}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className="text-sm font-bold text-gray-900">{student.casesCount}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {student.trend === 'improving' ? (
                      <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      student.hasImprovement ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.hasImprovement ? 'Improving' : 'Stable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalStudentPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalStudentPages}
            totalItems={progressData?.totalStudents || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Closed Cases Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Recently Closed Cases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Case ID</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Student</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Outcome</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-700">Closed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCases.map((caseItem) => (
                <tr key={caseItem.case_id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3 font-mono text-sm">#{caseItem.case_id}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm">{caseItem.student__full_name || 'N/A'}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      caseItem.progress_status === 'resolved' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {caseItem.progress_status?.replace('_', ' ').toUpperCase() || 'CLOSED'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                    {new Date(caseItem.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalCasesPages > 1 && (
          <TablePagination
            currentPage={casesPage}
            totalPages={totalCasesPages}
            totalItems={progressData?.totalClosedCases || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={setCasesPage}
          />
        )}
      </div>
    </div>
  );
}
