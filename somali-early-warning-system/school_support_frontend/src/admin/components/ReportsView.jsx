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
      color: 'green'
    },
    {
      id: 'risk',
      title: 'Risk Analysis',
      subtitle: 'Classroom Risk Summary',
      description: 'See which classrooms need attention and support',
      icon: AlertCircle,
      color: 'red'
    },
    {
      id: 'performance',
      title: 'Teacher Performance',
      subtitle: 'Form Master Metrics',
      description: 'Track how well teachers are helping students',
      icon: TrendingUp,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Download Reports</h1>
            <p className="text-gray-600 text-sm">Export system data in multiple formats</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Download comprehensive reports for analysis, compliance, and record-keeping. All reports contain sensitive student information.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          
          return (
            <div
              key={report.id}
              className="bg-white rounded-lg overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              {/* Card Header */}
              <div className="bg-gray-50 border-b border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    report.color === 'blue' ? 'bg-blue-100' :
                    report.color === 'red' ? 'bg-red-100' :
                    'bg-green-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      report.color === 'blue' ? 'text-blue-600' :
                      report.color === 'red' ? 'text-red-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600">{report.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  {report.description}
                </p>

                {/* Format Selection */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-3">Export Format:</p>
                  
                  {/* PDF Button */}
                  <button
                    onClick={() => handleExport(
                      report.id,
                      'pdf',
                      `/dashboard/admin/export/${report.id}/pdf/`,
                      `${report.id}_report_${new Date().toISOString().split('T')[0]}.pdf`
                    )}
                    disabled={loading[`${report.id}_pdf`]}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileType className="w-4 h-4 flex-shrink-0" />
                      <span>PDF Document</span>
                    </div>
                    <span className="text-xs bg-green-700 px-2 py-1 rounded">Print Ready</span>
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
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>Word Document</span>
                    </div>
                    <span className="text-xs bg-green-700 px-2 py-1 rounded">Editable</span>
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
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                      <span>Excel File</span>
                    </div>
                    <span className="text-xs bg-green-700 px-2 py-1 rounded">Data Only</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <FileType className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm">PDF Files</h3>
          </div>
          <p className="text-sm text-gray-600">Professional documents ready to print or share. Cannot be edited.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm">Word Files</h3>
          </div>
          <p className="text-sm text-gray-600">Open in Microsoft Word or Google Docs. You can edit and customize.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm">Excel Files</h3>
          </div>
          <p className="text-sm text-gray-600">Raw data for Excel or Google Sheets. Make your own charts.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-medium text-gray-900">
            Confidential Information
          </p>
        </div>
        <p className="text-sm text-gray-600">
          All reports contain private student information. Keep them secure and handle according to FERPA guidelines.
        </p>
        <p className="text-xs text-gray-500 mt-2">
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
