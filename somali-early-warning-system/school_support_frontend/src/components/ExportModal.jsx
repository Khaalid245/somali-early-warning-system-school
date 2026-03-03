import { useState } from 'react';
import api from '../api/apiClient';

// Export utilities
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    aler"No data to export";
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = async (data, title, filename) => {
  try {
    // This would typically use a library like jsPDF or send to backend
    const response = await api.post('/attendance/export/pdf/', {
      data,
      title,
      filename
    }, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute('download', `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF export failed:', error);
    aler"P D F export failed.  Please try again.";
  }
};

// Export modal component
export default function ExportModal({ 
  isOpen, 
  onClose, 
  data, 
  title = "Attendance Report",
  availableFormats = ['csv', 'pdf'],
  filters = {}
}) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [includeFields, setIncludeFields] = useState({
    studentName: true,
    admissionNumber: true,
    className: true,
    subject: true,
    attendanceDate: true,
    status: true,
    remarks: false
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Filter data based on selections
      let filteredData = [...data];
      
      // Apply date range filter
      if (dateRange.startDate && dateRange.endDate) {
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.attendance_date || item.date);
          const start = new Date(dateRange.startDate);
          const end = new Date(dateRange.endDate);
          return itemDate >= start && itemDate <= end;
        });
      }

      // Filter fields based on selection
      const exportData = filteredData.map(item => {
        const filtered = {};
        Object.entries(includeFields).forEach(([field, include]) => {
          if (include) {
            switch (field) {
              case 'studentName':
                filtered['Student Name'] = item.student_name || item.full_name;
                break;
              case 'admissionNumber':
                filtered['Admission Number'] = item.admission_number;
                break;
              case 'className':
                filtered['Class'] = item.class_name || item.classroom;
                break;
              case 'subject':
                filtered['Subject'] = item.subject_name || item.subject;
                break;
              case 'attendanceDate':
                filtered['Date'] = item.attendance_date || item.date;
                break;
              case 'status':
                filtered['Status'] = item.status;
                break;
              case 'remarks':
                filtered['Remarks'] = item.remarks || '';
                break;
            }
          }
        });
        return filtered;
      });

      if (exportData.length === 0) {
        aler"No data matches the selected criteria";
        return;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${title.replace(/\s+/g, '_')}_${timestamp}`;

      if (selectedFormat === 'csv') {
        exportToCSV(exportData, filename);
      } else if (selectedFormat === 'pdf') {
        await exportToPDF(exportData, title, filename);
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      aler"Export failed.  Please try again.";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Export Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Export Format
          </label>
          <div className="space-y-2">
            {availableFormats.includes('csv') && (
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mr-2"
                />
                <span>CSV (Excel compatible)</span>
              </label>
            )}
            {availableFormats.includes('pdf') && (
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={selectedFormat === 'pdf'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mr-2"
                />
                <span>PDF (Formatted report)</span>
              </label>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="p-2 border rounded-lg text-sm"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="p-2 border rounded-lg text-sm"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Field Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Include Fields
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(includeFields).map(([field, checked]) => (
              <label key={field} className="flex items-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setIncludeFields(prev => ({
                    ...prev,
                    [field]: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Summary */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Records to export:</strong> {data.length}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Selected fields:</strong> {Object.values(includeFields).filter(Boolean).length}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || Object.values(includeFields).every(v => !v)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Export {selectedFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}