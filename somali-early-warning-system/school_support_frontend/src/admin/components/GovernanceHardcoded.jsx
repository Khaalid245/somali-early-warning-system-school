import { useState } from 'react';
import UserManagement from './UserManagement';
import ClassroomManagement from './ClassroomManagement';
import StudentManagement from './StudentManagement';
import SubjectManagement from './SubjectManagement';
import EnrollmentManagement from './EnrollmentManagement';
import TeacherAssignment from './TeacherAssignment';

export default function GovernanceHardcoded() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div>
      {/* Tab Buttons - Hardcoded */}
      <div className="bg-white p-4 mb-4 rounded shadow">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('classrooms')}
            className={`px-4 py-2 rounded ${activeTab === 'classrooms' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Classroom Management
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Student Management
          </button>
          <button 
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded ${activeTab === 'subjects' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Subject Management
          </button>
          <button 
            onClick={() => setActiveTab('enrollments')}
            className={`px-4 py-2 rounded ${activeTab === 'enrollments' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Student Enrollment
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded ${activeTab === 'assignments' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Teacher Assignment
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'classrooms' && <ClassroomManagement />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'enrollments' && <EnrollmentManagement />}
        {activeTab === 'assignments' && <TeacherAssignment />}
      </div>
    </div>
  );
}