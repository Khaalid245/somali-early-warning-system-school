import React from 'react';
import { Users, BookOpen, CheckCircle } from 'lucide-react';

export default function TimetableStats({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      label: 'Teachers assigned',
      value: `${stats.assignedTeachers} / ${stats.totalTeachers}`,
      icon: Users,
      border: 'border-l-blue-400',
    },
    {
      label: 'Classrooms scheduled',
      value: `${stats.scheduledClassrooms} / ${stats.totalClassrooms}`,
      icon: BookOpen,
      border: 'border-l-amber-400',
    },
    {
      label: 'Completion',
      value: `${stats.completionRate}%`,
      icon: CheckCircle,
      border: stats.completionRate === 100 ? 'border-l-green-400' : 'border-l-gray-300',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {cards.map(({ label, value, icon: Icon, border }) => (
        <div key={label} className={`bg-white border border-gray-200 border-l-4 ${border} rounded-lg p-3`}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500">{label}</p>
            <Icon className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <p className="text-xl font-semibold text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}
