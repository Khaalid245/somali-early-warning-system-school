import React from 'react';

export default function RiskLevelFilter({ selectedRisk, onFilterChange }) {
  const riskLevels = [
    { value: 'all', label: 'All Risks', color: 'bg-green-50 text-green-800 border border-green-200' },
    { value: 'critical', label: 'Critical', color: 'bg-red-50 text-red-800 border border-red-200' },
    { value: 'high', label: 'High', color: 'bg-orange-50 text-orange-800 border border-orange-200' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    { value: 'low', label: 'Low', color: 'bg-gray-50 text-gray-800 border border-gray-200' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {riskLevels.map(risk => (
        <button
          key={risk.value}
          onClick={() => onFilterChange(risk.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedRisk === risk.value
              ? risk.color
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {risk.label}
        </button>
      ))}
    </div>
  );
}
