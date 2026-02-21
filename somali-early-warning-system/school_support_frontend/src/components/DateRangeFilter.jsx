import React from 'react';

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange, onClear }) {
  return (
    <div className="flex gap-3 items-center bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">From:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">To:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          Clear
        </button>
      )}
    </div>
  );
}
