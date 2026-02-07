import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";

// Teacher pages
import TeacherDashboard from "./teacher/Dashboard";
import AttendancePage from "./teacher/AttendancePage";
import MyClasses from "./teacher/MyClasses";
import MySubjects from "./teacher/MySubjects"; // ✅ added import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/login" element={<Login />} />

        {/* TEACHER DASHBOARD */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* TEACHER ATTENDANCE */}
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute role="teacher">
              <AttendancePage />
            </ProtectedRoute>
          }
        />

        {/* TEACHER CLASSES */}
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute role="teacher">
              <MyClasses />
            </ProtectedRoute>
          }
        />

        {/* TEACHER SUBJECTS */}
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
  );
}

export default App;
