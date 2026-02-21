import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";

// Teacher pages
import TeacherDashboard from "./teacher/DashboardNew";
import AttendancePage from "./teacher/AttendancePageNew";
import ProfilePage from "./teacher/ProfilePage";
import SettingsPage from "./teacher/SettingsPage";
import MyClasses from "./teacher/MyClasses";
import MySubjects from "./teacher/MySubjects";

// Form Master pages
import FormMasterDashboard from "./formMaster/DashboardClean";
import InterventionsPage from "./formMaster/InterventionsPage";
import StudentAttendanceReport from "./pages/StudentAttendanceReport";

// Admin pages
import AdminDashboard from "./admin/Dashboard";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster />
        <Routes>
        {/* Default route */}
        <Route
          path="/"
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

        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<Login />} />

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
          path="/teacher/profile"
          element={
            <ProtectedRoute role="teacher">
              <ProfilePage />
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
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
