import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";

export default function Sidebar({ user, onLogout, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const menuItems = [
    { icon: "📊", label: "Dashboard", path: "/teacher", badge: null, isRoute: true },
    { icon: "✓", label: "Take Attendance", path: "/teacher/attendance", badge: null, isRoute: true },
    { icon: "🔔", label: "Alerts", path: "alerts", badge: 3, isRoute: false },
    { icon: "👥", label: "Students", path: "students", badge: null, isRoute: false },
    { icon: "📚", label: "My Classes", path: "/teacher/classes", badge: null, isRoute: true },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleMenuClick = (item) => {
    if (item.isRoute) {
      navigate(item.path);
    } else {
      // For dashboard tabs
      if (location.pathname === "/teacher") {
        onTabChange?.(item.path);
      } else {
        navigate("/teacher");
        setTimeout(() => onTabChange?.(item.path), 100);
      }
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
              <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">EWS Portal</h1>
              <p className="text-xs text-gray-500">Teacher</p>
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
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg mb-1 sm:mb-2 transition ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-xs sm:text-sm truncate">{item.label}</span>
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
                <p className="text-xs text-gray-500">Teacher</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs sm:text-sm font-medium ${
              collapsed ? "px-1" : ""
            }`}
          >
            {collapsed ? "🚪" : "Logout"}
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

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
}
