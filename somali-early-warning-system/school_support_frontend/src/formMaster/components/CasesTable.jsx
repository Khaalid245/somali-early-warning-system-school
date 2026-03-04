export default function CasesTable({ cases, getCaseStatusBadgeColor }) {
  if (!cases || cases.length === 0) {
    return <div className="p-6 text-center text-gray-500 text-sm">No pending cases</div>;
  }

  const getDaysOpen = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Case ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Days Open</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map((caseItem) => {
                const daysOpen = getDaysOpen(caseItem.created_at);
                const isOverdue = daysOpen > 14;
                return (
                  <tr key={caseItem.case_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-sm text-gray-800">#{caseItem.case_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{caseItem.student__full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCaseStatusBadgeColor(caseItem.status)}`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {daysOpen} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3 p-3">
        {cases.map((caseItem) => {
          const daysOpen = getDaysOpen(caseItem.created_at);
          const isOverdue = daysOpen > 14;
          return (
            <div key={caseItem.case_id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-gray-500">#{caseItem.case_id}</p>
                  <p className="font-medium text-sm text-gray-800 truncate">{caseItem.student__full_name}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getCaseStatusBadgeColor(caseItem.status)}`}>
                  {caseItem.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {daysOpen} days open
                </span>
                <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
