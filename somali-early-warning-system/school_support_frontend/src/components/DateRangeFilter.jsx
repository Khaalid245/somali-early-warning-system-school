import React from 'react';

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange, onClear }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center bg-white p-3 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="flex-1 px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="flex-1 px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
        >
          Clear
        </button>
      )}
    </div>
  );
}
