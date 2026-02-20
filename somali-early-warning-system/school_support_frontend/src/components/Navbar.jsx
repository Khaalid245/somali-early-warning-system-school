import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user, dashboardData, searchQuery, onSearchChange, searchResults, showSearchResults, onCloseSearch }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleSearchResultClick = (result) => {
    if (result.type === 'student') {
      // Navigate to student detail or show info
      onCloseSearch();
    } else if (result.type === 'class') {
      navigate('/teacher/attendance', { state: { classroom: result.name } });
      onCloseSearch();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Page Title */}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Dashboard</h2>
          <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <input
              type="text"
              placeholder="Search students, classes..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => searchResults?.length > 0 && onSearchChange?.(searchQuery)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 xl:w-64 text-sm"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults?.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={onCloseSearch} />
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSearchResultClick(result)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      {result.type === 'student' ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">👤</span>
                            <p className="text-sm font-semibold text-gray-800">{result.full_name}</p>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">Student ID: {result.student_id}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">📚</span>
                            <p className="text-sm font-semibold text-gray-800">{result.name}</p>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">Grade {result.grade_level}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <span className="text-xl sm:text-2xl">🔔</span>
              {dashboardData?.active_alerts > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                  {dashboardData.active_alerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96">
                  <div className="p-3 sm:p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {dashboardData?.urgent_alerts?.slice(0, 5).map((alert) => (
                      <div key={alert.alert_id} className="p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{alert.student__full_name}</p>
                        <p className="text-xs text-gray-600 truncate">{alert.alert_type} - {alert.subject__name}</p>
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          alert.risk_level === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {alert.risk_level}
                        </span>
                      </div>
                    )) || <p className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500">No notifications</p>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || "T"}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden md:block truncate max-w-24">{user?.name || "Teacher"}</span>
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-2 sm:p-3 border-b border-gray-200">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{user?.name || "Teacher"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || "teacher@school.com"}</p>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/teacher/profile'}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                  >
                    👤 Profile
                  </button>
                  <button 
                    onClick={() => window.location.href = '/teacher/settings'}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                  >
                    ⚙️ Settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
