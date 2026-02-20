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
              ) : user.role === "admin" ? (
                <Navigate to="/admin" />
              ) : user.role === "counsellor" ? (
                <Navigate to="/counsellor" />
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

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <h1>Admin Dashboard</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
