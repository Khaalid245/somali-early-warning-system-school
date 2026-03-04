import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function MobileLayout({ children, user, onLogout, activeTab, onTabChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'cases', label: 'Cases', icon: '📋' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'progression', label: 'Progress', icon: '📈' },
    { id: 'daily-monitor', label: 'Daily', icon: '📅' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-bold">Form Master</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 px-4 pb-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="bg-white w-64 h-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Form Master
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-2 bg-red-600 text-white rounded-lg font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 lg:p-8">
        {children}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// Mobile-optimized table wrapper
export function MobileTable({ headers, data, renderRow, emptyMessage }) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className={`px-6 py-4 text-sm font-semibold text-gray-700 ${header.align || 'text-left'}`}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((item, idx) => renderRow(item, idx))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.length > 0 ? (
          data.map((item, idx) => renderRow(item, idx, true))
        ) : (
          <div className="p-12 text-center text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </>
  );
}

// Mobile-optimized stats grid
export function MobileStatsGrid({ children }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {children}
    </div>
  );
}

// Mobile-optimized section
export function MobileSection({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
      <div className="p-4 lg:p-6">
        {children}
      </div>
    </div>
  );
}
