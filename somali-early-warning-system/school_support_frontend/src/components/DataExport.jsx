import { useState } from 'react';
import { auditLogger, AUDIT_ACTIONS } from '../utils/audit';

export default function DataExport({ data, filename, onClose }) {
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    
    try {
      let content, mimeType, extension;
      
      if (format === 'csv') {
        content = convertToCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Audit log
      await auditLogger.log(AUDIT_ACTIONS.DATA_EXPORT, {
        filename: link.download,
        format,
        recordCount: data.length
      });
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Export Data</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Format</label>
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Exporting {data.length} records as {format.toUpperCase()}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportData}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}