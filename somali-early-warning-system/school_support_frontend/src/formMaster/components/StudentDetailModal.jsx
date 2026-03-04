import { useState, useEffect } from 'react';
import { X, User, AlertTriangle, FileText, Calendar } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function StudentDetailModal({ studentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    loadStudentDetails();
  }, [studentId]);

  const loadStudentDetails = async () => {
    try {
      const [studentRes, alertsRes, casesRes] = await Promise.all([
        api.get(`/students/${studentId}/`),
        api.get(`/alerts/?student=${studentId}`),
        api.get(`/interventions/?student=${studentId}`),
      ]);

      setStudentData({
        student: studentRes.data,
        alerts: Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data.results || [],
        cases: Array.isArray(casesRes.data) ? casesRes.data : casesRes.data.results || [],
      });
    } catch (error) {
      showToast.error('Failed to load student details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  const { student, alerts, cases } = studentData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {student.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
              <p className="text-sm text-gray-600">
                ID: {student.student_id} | Admission: {student.admission_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alerts.length },
            { id: 'cases', label: 'Cases', icon: FileText, count: cases.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {student.date_of_birth || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {student.gender || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Contact Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {student.contact_number || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {student.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Address */}
              {student.address && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Address</p>
                  <p className="text-gray-900">{student.address}</p>
                </div>
              )}

              {/* Guardian Info */}
              {(student.guardian_name || student.guardian_contact) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Guardian Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {student.guardian_name && (
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold text-gray-900">{student.guardian_name}</p>
                      </div>
                    )}
                    {student.guardian_contact && (
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-semibold text-gray-900">{student.guardian_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.alert_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            alert.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                            alert.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.risk_level?.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">{alert.alert_type}</span>
                        </div>
                        <p className="text-sm text-gray-700">{alert.description || 'No description'}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.alert_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        alert.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        alert.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No alerts found for this student</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="space-y-3">
              {cases.length > 0 ? (
                cases.map((caseItem) => (
                  <div key={caseItem.case_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">Case #{caseItem.case_id}</p>
                        <p className="text-sm text-gray-600">{caseItem.intervention_type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        caseItem.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        caseItem.status === 'closed' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {caseItem.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{caseItem.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(caseItem.created_at).toLocaleDateString()}</span>
                      {caseItem.follow_up_date && (
                        <span>Follow-up: {new Date(caseItem.follow_up_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No intervention cases found for this student</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
