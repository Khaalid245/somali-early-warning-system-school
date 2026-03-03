import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from 'lucide-react';

export default function Sidebar({ user, onLogout, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const menuItems = user?.role === 'admin' ? [
    { icon: "🏛️", label: "Dashboard", path: "/admin", badge: null, isRoute: true },
    { icon: "🔔", label: "Alerts", path: "alerts", badge: null, isRoute: false },
    { icon: "📋", label: "Cases", path: "cases", badge: null, isRoute: false },
    { icon: "👥", label: "Students", path: "students", badge: null, isRoute: false },
    { icon: "⚙️", label: "Governance", path: "governance", badge: null, isRoute: false },
    { icon: "🛡️", label: "Audit Logs", path: "audit", badge: null, isRoute: false },
    { icon: "📊", label: "Reports", path: "reports", badge: null, isRoute: false },
    { icon: "👤", label: "My Profile", path: "settings", badge: null, isRoute: false, description: "Profile & 2FA", tabName: "profile" },
    { icon: "🔧", label: "System Settings", path: "settings", badge: null, isRoute: false, description: "School & Security", tabName: "settings" },
  ] : user?.role === 'form_master' ? [
    { icon: "📊", label: "Dashboard", path: "/form-master", badge: null, isRoute: true },
    { icon: "📝", label: "Interventions", path: "/form-master/interventions", badge: null, isRoute: true },
    { icon: "🔔", label: "Alerts", path: "alerts", badge: null, isRoute: false },
    { icon: "📋", label: "Cases", path: "cases", badge: null, isRoute: false },
    { icon: "⚠️", label: "High Risk", path: "students", badge: null, isRoute: false },
    { icon: "📈", label: "Progression", path: "progression", badge: null, isRoute: false },
    { icon: "📅", label: "Attendance", path: "attendance", badge: null, isRoute: false },
    { icon: "📊", label: "Daily Monitor", path: "daily-monitor", badge: null, isRoute: false },
    { icon: "👤", label: "Profile", path: "/form-master/profile", badge: null, isRoute: true },
    { icon: "⚙️", label: "Settings", path: "/form-master/settings", badge: null, isRoute: true },
  ] : [
    { icon: "📊", label: "Dashboard", path: "/teacher", badge: null, isRoute: true },
    { icon: "✓", label: "Take Attendance", path: "/teacher/attendance", badge: null, isRoute: true },
    { icon: "✏️", label: "Edit Attendance", path: "/teacher/edit-attendance", badge: null, isRoute: true },
    { icon: "📈", label: "Attendance Tracking", path: "/teacher/attendance-tracking", badge: null, isRoute: true },
    { icon: "🔔", label: "Alerts", path: "alerts", badge: null, isRoute: false },
    { icon: "👥", label: "Students", path: "students", badge: null, isRoute: false },
    { icon: "📚", label: "My Classes", path: "/teacher/classes", badge: null, isRoute: true },
    { icon: "👤", label: "Profile", path: "/teacher/profile", badge: null, isRoute: true },
    { icon: "⚙️", label: "Settings", path: "/teacher/settings", badge: null, isRoute: true },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    onLogout();
  };

  const handleMenuClick = (item) => {
    const basePath = user?.role === 'admin' ? '/admin' : user?.role === 'form_master' ? '/form-master' : '/teacher';
    
    if (item.isRoute) {
      navigate(item.path);
      if (item.path === basePath) {
        onTabChange?.('overview');
      }
    } else {
      navigate(basePath);
      // Use tabName if provided (for settings sub-tabs), otherwise use path
      const tabToActivate = item.tabName || item.path;
      setTimeout(() => onTabChange?.(tabToActivate), 50);
    }
    if (isMobile) setCollapsed(true);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 ${
          isMobile ? 'fixed h-full' : 'relative'
        } ${
          collapsed ? (isMobile ? '-translate-x-full' : 'w-16 sm:w-20') : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">Somali EWS</h1>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'form_master' ? 'Form Master' : 'Teacher'}
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <span className="text-lg sm:text-xl">{collapsed ? "→" : "←"}</span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-2 sm:p-3 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={`${item.path}-${index}`}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg mb-1 sm:mb-2 transition ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={item.description || item.label}
            >
              <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left">
                    <span className="text-xs sm:text-sm truncate block">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-gray-500 truncate block">{item.description}</span>
                    )}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-2 sm:p-3 border-t border-gray-200">
          <div className={`flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 ${
            collapsed ? "justify-center" : ""
          }`}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm sm:text-base">
              {user?.name?.charAt(0) || "T"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{user?.name || "Teacher"}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'form_master' ? 'Form Master' : 'Teacher'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs sm:text-sm font-medium`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg z-50 flex items-center justify-center md:hidden"
        >
          <span className="text-2xl">☰</span>
        </button>
      )}
    </>
  );
}
