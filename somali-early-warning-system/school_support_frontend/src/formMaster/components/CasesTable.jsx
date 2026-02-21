export default function CasesTable({ cases, getCaseStatusBadgeColor }) {
  if (!cases || cases.length === 0) {
    return <div className="p-8 sm:p-12 text-center text-gray-500 text-sm sm:text-base">No pending cases</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Case ID</th>
            <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Student</th>
            <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
            <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Follow-up</th>
            <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {cases.map((caseItem) => (
            <tr key={caseItem.case_id} className="hover:bg-gray-50 transition">
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm text-gray-800">#{caseItem.case_id}</td>
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800">{caseItem.student__full_name}</td>
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getCaseStatusBadgeColor(caseItem.status)}`}>
                  {caseItem.status.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                {caseItem.follow_up_date ? new Date(caseItem.follow_up_date).toLocaleDateString() : 'Not set'}
              </td>
              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                {new Date(caseItem.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
