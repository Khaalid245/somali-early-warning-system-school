import React from 'react';

export default function RiskLevelFilter({ selectedRisk, onFilterChange }) {
  const riskLevels = [
    { value: 'all', label: 'All Risks', color: 'bg-gray-100 text-gray-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {riskLevels.map(risk => (
        <button
          key={risk.value}
          onClick={() => onFilterChange(risk.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedRisk === risk.value
              ? risk.color + ' ring-2 ring-offset-1 ring-blue-500'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {risk.label}
        </button>
      ))}
    </div>
  );
}
