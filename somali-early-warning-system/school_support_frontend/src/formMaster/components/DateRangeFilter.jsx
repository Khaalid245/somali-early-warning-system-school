import { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function DateRangeFilter({ onDateChange }) {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const handleDateChange = (field, value) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    
    if (newRange.startDate && newRange.endDate) {
      onDateChange?.(newRange);
    }
  };

  const handlePresetRange = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'semester':
        const month = today.getMonth();
        if (month >= 8) { // Fall semester
          startDate = new Date(today.getFullYear(), 8, 1).toISOString().split('T')[0];
        } else { // Spring semester
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        }
        endDate = new Date().toISOString().split('T')[0];
        break;
      default:
        return;
    }

    const newRange = { startDate, endDate };
    setDateRange(newRange);
    onDateChange?.(newRange);
  };

  const clearDates = () => {
    setDateRange({ startDate: '', endDate: '' });
    onDateChange?.({ startDate: '', endDate: '' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Date Range:</span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePresetRange('today')}
            className="px-3 py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            📅 Today
          </button>
          <button
            onClick={() => handlePresetRange('week')}
            className="px-3 py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            📊 Last 7 Days
          </button>
          <button
            onClick={() => handlePresetRange('month')}
            className="px-3 py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            📆 This Month
          </button>
          <button
            onClick={() => handlePresetRange('semester')}
            className="px-3 py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            🎓 This Semester
          </button>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500 text-xs sm:text-sm">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            min={dateRange.startDate}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {(dateRange.startDate || dateRange.endDate) && (
          <button
            onClick={clearDates}
            className="px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
