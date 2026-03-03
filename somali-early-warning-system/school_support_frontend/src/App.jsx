import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import SessionTimeout from './components/SessionTimeout';

import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";

// Teacher pages
import TeacherDashboard from "./teacher/DashboardNew";
import DebugDashboard from "./teacher/DebugDashboard";
import AttendancePage from "./teacher/AttendancePageNew";
import EditAttendance from "./teacher/EditAttendance";
import AttendanceTracking from "./teacher/AttendanceTracking";
import AttendanceHistory from "./teacher/AttendanceHistory";
import ProfilePage from "./teacher/ProfilePage";
import SettingsPage from "./teacher/SettingsPage";
import MyClasses from "./teacher/MyClasses";
import MySubjects from "./teacher/Mysubjects";

// Form Master pages
import FormMasterDashboard from "./formMaster/DashboardClean";
import InterventionsPage from "./formMaster/InterventionsPage";
import StudentAttendanceReport from "./pages/StudentAttendanceReport";

// Admin pages
import AdminDashboard from "./admin/Dashboard";

// Landing pages
import Home from "./landing/Home";
import About from "./landing/About";
import Contact from "./landing/Contact";
import HelpSupport from "./landing/HelpSupport";
import UserGuide from "./landing/UserGuide";
import PrivacyPolicy from "./landing/PrivacyPolicy";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster />
        {user && <SessionTimeout />}
        <Routes>
        {/* LANDING PAGES - Public */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help-support" element={<HelpSupport />} />
        <Route path="/user-guide" element={<UserGuide />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* DASHBOARD REDIRECT */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === "teacher" ? (
                <Navigate to="/teacher" />
              ) : user.role === "form_master" ? (
                <Navigate to="/form-master" />
              ) : user.role === "admin" ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* TEACHER ROUTES */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute role="teacher">
              <AttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/edit-attendance"
          element={
            <ProtectedRoute role="teacher">
              <EditAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/debug"
          element={
            <ProtectedRoute role="teacher">
              <DebugDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute role="teacher">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance-tracking"
          element={
            <ProtectedRoute role="teacher">
              <AttendanceTracking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance-history/:studentId"
          element={
            <ProtectedRoute role="teacher">
              <AttendanceHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/settings"
          element={
            <ProtectedRoute role="teacher">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute role="teacher">
              <MyClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/subjects"
          element={
            <ProtectedRoute role="teacher">
              <MySubjects />
            </ProtectedRoute>
          }
        />

        {/* COUNSELLOR */}
        <Route
          path="/counsellor"
          element={
            <ProtectedRoute role="counsellor">
              <h1>Counsellor Dashboard</h1>
            </ProtectedRoute>
          }
        />

        {/* FORM MASTER */}
        <Route
          path="/form-master"
          element={
            <ProtectedRoute role="form_master">
              <FormMasterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form-master/interventions"
          element={
            <ProtectedRoute role="form_master">
              <InterventionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form-master/settings"
          element={
            <ProtectedRoute role="form_master">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form-master/profile"
          element={
            <ProtectedRoute role="form_master">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ATTENDANCE REPORT - Public for families */}
        <Route
          path="/attendance-report/:studentId"
          element={<StudentAttendanceReport />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute role="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute role="admin">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
