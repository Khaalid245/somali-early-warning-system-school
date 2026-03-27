import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';
import { getUserFriendlyError, operationErrors } from '../../utils/errorMessages';
import TablePagination from '../../components/TablePagination';
import EscalateToAdminModal from './EscalateToAdminModal';
import UpdateProgressModal from './UpdateProgressModal';
import { TrendingUp, TrendingDown, CheckCircle, Clock, FileCheck, ClipboardList } from 'lucide-react';

export default function ProgressionTracking({ cases, onUpdateProgress, onEscalate, isLoading }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [casesPage, setCasesPage] = useState(1);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Fetch dashboard data (has all classroom students) and open cases
      const [dashboardRes, casesRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get('/interventions/')
      ]);

      const allCases = Array.isArray(casesRes.data) ? casesRes.data : casesRes.data.results || [];
      const openCases = allCases.filter(c => c.status !== 'closed');
      const closedCases = allCases.filter(c => c.status === 'closed');
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
        openCases,
        studentProgress,
        totalStudents: studentProgress.length,
        totalClosedCases: closedCases.length,
        totalOpenCases: openCases.length
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-800">{progressData?.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Avg Resolution</p>
              <p className="text-2xl font-semibold text-gray-800">{progressData?.avgResolution} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Successful Cases</p>
              <p className="text-2xl font-semibold text-gray-800">{progressData?.successfulCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total Closed</p>
              <p className="text-2xl font-semibold text-gray-800">{progressData?.totalClosed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Progress Table */}
      <div className="bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Student Progress Over Time</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Risk Level</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Attendance</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Days Missed</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cases</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trend</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <tr 
                  key={student.student_id}
                  style={{ transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td className="px-3 sm:px-4 py-3">
                    <p className="font-semibold text-sm text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      student.risk_level === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      student.risk_level === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      student.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {student.risk_level?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${
                      student.attendance_rate >= 75 ? 'text-green-600' :
                      student.attendance_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {student.attendance_rate}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${
                      student.days_missed === 0 ? 'text-gray-400' :
                      student.days_missed >= 10 ? 'text-red-600' :
                      student.days_missed >= 5 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {student.days_missed}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-800">{student.casesCount}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {student.trend === 'improving' ? (
                      <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                      student.hasImprovement ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
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

      {/* Open Cases Table with Escalation */}
      <div className="bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Open Cases - Action Required</h3>
          <p className="text-xs sm:text-sm text-gray-500">Cases that need progress updates or escalation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Case ID</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Days Open</th>
                <th className="text-center px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {progressData?.openCases?.map((caseItem) => {
                const daysOpen = Math.floor((new Date() - new Date(caseItem.created_at)) / (1000 * 60 * 60 * 24));
                const isOverdue = daysOpen > 14;
                return (
                  <tr 
                    key={caseItem.case_id} 
                    className={isOverdue ? 'bg-red-50' : ''}
                    style={{ transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => !isOverdue && (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={(e) => !isOverdue && (e.currentTarget.style.background = 'white')}
                  >
                    <td className="px-3 sm:px-4 py-3 font-mono text-sm">#{caseItem.case_id}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-semibold text-sm text-gray-800">{caseItem.student__full_name}</p>
                      <p className="text-xs text-gray-500">ID: {caseItem.student}</p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        caseItem.status === 'escalated_to_admin' ? 'bg-red-50 text-red-700 border-red-200' :
                        caseItem.status === 'in_progress' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {caseItem.status === 'escalated_to_admin' ? 'Escalated' : caseItem.status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`text-sm font-semibold ${
                        isOverdue ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {daysOpen} days
                        {isOverdue && <span className="block text-xs text-red-500">OVERDUE</span>}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        caseItem.progress_status === 'improving' ? 'bg-green-50 text-green-700 border-green-200' :
                        caseItem.progress_status === 'not_improving' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {caseItem.progress_status ? caseItem.progress_status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'No contact'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedCase(caseItem);
                            setShowProgressModal(true);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-xs font-medium"
                        >
                          Update Progress
                        </button>
                        {caseItem.status !== 'escalated_to_admin' && (
                          <button
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setShowEscalateModal(true);
                            }}
                            className="px-3 py-1.5 text-red-600 bg-transparent hover:bg-red-50 border border-red-400 rounded-lg transition-colors text-xs font-medium"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) || []}
            </tbody>
          </table>
        </div>
        {!progressData?.openCases?.length && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">No Open Cases</p>
            <p className="text-sm">All cases have been resolved or escalated</p>
          </div>
        )}
      </div>

      {/* Closed Cases Summary */}
      <div className="bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Recently Closed Cases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Case ID</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Outcome</th>
                <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Closed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCases.map((caseItem) => (
                <tr 
                  key={caseItem.case_id}
                  style={{ transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td className="px-3 sm:px-4 py-3 font-mono text-sm">#{caseItem.case_id}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800">{caseItem.student__full_name || 'N/A'}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                      caseItem.progress_status === 'resolved' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-gray-50 text-gray-700 border-gray-200'
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

      {/* Escalate to Admin Modal */}
      {showEscalateModal && selectedCase && (
        <EscalateToAdminModal
          isOpen={showEscalateModal}
          onClose={() => {
            setShowEscalateModal(false);
            setSelectedCase(null);
          }}
          caseData={selectedCase}
          onEscalate={async (caseId, reason) => {
            if (onEscalate) {
              await onEscalate(caseId, reason);
              loadProgressData(); // Refresh data
            }
          }}
        />
      )}

      {/* Update Progress Modal */}
      {showProgressModal && selectedCase && (
        <UpdateProgressModal
          isOpen={showProgressModal}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedCase(null);
          }}
          caseData={selectedCase}
          onUpdate={async (caseId, formData) => {
            if (onUpdateProgress) {
              await onUpdateProgress(caseId, formData);
              loadProgressData(); // Refresh data
            }
          }}
        />
      )}
    </div>
  );
}
