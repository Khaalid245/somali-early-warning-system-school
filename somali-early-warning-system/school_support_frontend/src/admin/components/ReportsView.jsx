import { useState } from 'react';
import { FileText, Download, TrendingUp, Users, AlertCircle, BarChart3 } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function ReportsView() {
  const [loading, setLoading] = useState({});

  const handleExport = async (reportType, endpoint, filename) => {
    setLoading(prev => ({ ...prev, [reportType]: true }));
    
    try {
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast.success(`${reportType} exported successfully`);
    } catch (err) {
      console.error(`Failed to export ${reportType}:`, err);
      showToast.error(`Failed to export ${reportType}`);
    } finally {
      setLoading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const reports = [
    {
      id: 'cases',
      title: 'Intervention Cases Report',
      description: 'Complete list of all intervention cases with status, progress, and resolution details',
      icon: FileText,
      color: 'blue',
      endpoint: '/dashboard/admin/export/cases/',
      filename: `cases_report_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'risk',
      title: 'Risk Summary by Classroom',
      description: 'Risk distribution, alert counts, and case statistics grouped by classroom',
      icon: AlertCircle,
      color: 'red',
      endpoint: '/dashboard/admin/export/risk-summary/',
      filename: `risk_summary_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'performance',
      title: 'Form Master Performance Metrics',
      description: 'Evaluation of form master effectiveness including resolution times and ratings',
      icon: TrendingUp,
      color: 'green',
      endpoint: '/dashboard/admin/export/performance/',
      filename: `performance_metrics_${new Date().toISOString().split('T')[0]}.csv`
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Reports & Export</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            const colors = getColorClasses(report.color);
            
            return (
              <div
                key={report.id}
                className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 hover:shadow-lg transition`}
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className={`w-8 h-8 ${colors.icon}`} />
                  <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-white rounded-full border border-gray-300">
                    CSV
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {report.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 min-h-[3rem]">
                  {report.description}
                </p>

                <button
                  onClick={() => handleExport(report.title, report.endpoint, report.filename)}
                  disabled={loading[report.title]}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 ${colors.button} text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Download className="w-4 h-4" />
                  {loading[report.title] ? 'Exporting...' : 'Export Report'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Guidelines */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Export Guidelines</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-semibold mt-0.5">•</span>
            <span>All reports are exported in CSV format for easy analysis in Excel or Google Sheets</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold mt-0.5">•</span>
            <span>Reports include data up to the current date and time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold mt-0.5">•</span>
            <span>Sensitive student information is included - handle reports securely and in compliance with data protection policies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold mt-0.5">•</span>
            <span>All export actions are logged in the audit trail for accountability</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
