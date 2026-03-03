import { useState } from 'react';
import { FileText, Download, TrendingUp, AlertCircle, BarChart3, FileSpreadsheet, FileType } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function ReportsView() {
  const [loading, setLoading] = useState({});

  const handleExport = async (reportType, format, endpoint, filename) => {
    const key = `${reportType}_${format}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    
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
      
      showToast.success(`Report downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(`Failed to export:`, err);
      showToast.error(`Failed to download report`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const reports = [
    {
      id: 'cases',
      title: 'Student Cases',
      subtitle: 'Intervention & Support Cases',
      description: 'View all student intervention cases, their status, and progress',
      icon: FileText,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      emoji: '📋'
    },
    {
      id: 'risk',
      title: 'Risk Analysis',
      subtitle: 'Classroom Risk Summary',
      description: 'See which classrooms need attention and support',
      icon: AlertCircle,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      emoji: '⚠️'
    },
    {
      id: 'performance',
      title: 'Teacher Performance',
      subtitle: 'Form Master Metrics',
      description: 'Track how well teachers are helping students',
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      emoji: '📊'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white truncate">Download Reports</h1>
            <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Somali Early Warning System</p>
          </div>
        </div>
      </div>

      {/* Simple Instructions */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">📥 How to Download</h2>
        <ol className="space-y-1 text-xs sm:text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
            <span>Choose a report type below</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
            <span>Click the button for the format you want</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
            <span>The file will download to your computer</span>
          </li>
        </ol>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {reports.map((report) => {
          const Icon = report.icon;
          
          return (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${report.gradient} p-4 sm:p-5`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl sm:text-4xl">{report.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                      {report.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/90 truncate">{report.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-4 leading-relaxed">
                  {report.description}
                </p>

                {/* Format Selection */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Choose Format:</p>
                  
                  {/* PDF Button */}
                  <button
                    onClick={() => handleExport(
                      report.id,
                      'pdf',
                      `/dashboard/admin/export/${report.id}/pdf/`,
                      `${report.id}_report_${new Date().toISOString().split('T')[0]}.pdf`
                    )}
                    disabled={loading[`${report.id}_pdf`]}
                    className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-2">
                      <FileType className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-semibold">PDF Document</span>
                    </div>
                    <span className="text-xs bg-red-700 px-2 py-1 rounded">Best for Print</span>
                  </button>

                  {/* DOCX Button */}
                  <button
                    onClick={() => handleExport(
                      report.id,
                      'docx',
                      `/dashboard/admin/export/${report.id}/docx/`,
                      `${report.id}_report_${new Date().toISOString().split('T')[0]}.docx`
                    )}
                    disabled={loading[`${report.id}_docx`]}
                    className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-semibold">Word Document</span>
                    </div>
                    <span className="text-xs bg-blue-700 px-2 py-1 rounded">Can Edit</span>
                  </button>

                  {/* CSV Button */}
                  <button
                    onClick={() => handleExport(
                      report.id,
                      'csv',
                      report.id === 'cases' ? '/dashboard/admin/export/cases/' :
                      report.id === 'risk' ? '/dashboard/admin/export/risk-summary/' :
                      '/dashboard/admin/export/performance/',
                      `${report.id}_report_${new Date().toISOString().split('T')[0]}.csv`
                    )}
                    disabled={loading[`${report.id}_csv`]}
                    className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-semibold">Excel File</span>
                    </div>
                    <span className="text-xs bg-green-700 px-2 py-1 rounded">For Data</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Help Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileType className="w-5 h-5 text-red-600 flex-shrink-0" />
            <h3 className="font-bold text-red-900 text-sm sm:text-base">PDF Files</h3>
          </div>
          <p className="text-xs sm:text-sm text-red-800">Professional documents ready to print or share. Cannot be edited.</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h3 className="font-bold text-blue-900 text-sm sm:text-base">Word Files</h3>
          </div>
          <p className="text-xs sm:text-sm text-blue-800">Open in Microsoft Word or Google Docs. You can edit and customize.</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
            <h3 className="font-bold text-green-900 text-sm sm:text-base">Excel Files</h3>
          </div>
          <p className="text-xs sm:text-sm text-green-800">Raw data for Excel or Google Sheets. Make your own charts.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 text-center">
        <p className="text-xs sm:text-sm text-gray-600">
          🔒 All reports contain private student information. Keep them secure.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Generated on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
