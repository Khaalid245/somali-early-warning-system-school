import { useState } from 'react';
import { Shield, Users, School, UserPlus, BookOpen, GraduationCap, Book } from 'lucide-react';
import UserManagement from './UserManagement';
import ClassroomManagement from './ClassroomManagement';
import StudentManagement from './StudentManagement';
import SubjectManagement from './SubjectManagement';
import EnrollmentManagement from './EnrollmentManagement';
import TeacherAssignment from './TeacherAssignment';

export default function GovernanceSimple() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Governance</h1>
        </div>
        <p className="text-gray-600">Complete school management system</p>
      </div>

      {/* Simple Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`p-3 rounded text-sm font-medium transition ${
                activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 mx-auto mb-1" />
              User Management
            </button>
            
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`p-3 rounded text-sm font-medium transition ${
                activeTab === 'classrooms' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <School className="w-4 h-4 mx-auto mb-1" />
              Classroom Management
            </button>
            
            <button
              onClick={() => setActiveTab('students')}
              className={`p-3 rounded text-sm font-medium transition ${
                activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 mx-auto mb-1" />
              Student Management
            </button>
            
            <button
              onClick={() => setActiveTab('subjects')}
              className={`p-3 rounded text-sm font-medium transition ${
                activeTab === 'subjects' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Book className="w-4 h-4 mx-auto mb-1" />
              Subject Management
            </button>
            
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`p-3 rounded text-sm font-medium transition ${
                activeTab === 'enrollments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4 mx-auto mb-1" />
              Student Enrollment
            </button>
            
            <button
              onClick={() => setActiveTab('assignments')}
              className={`p-3 rounded text-sm font-medium transition ${
                activeTab === 'assignments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 mx-auto mb-1" />
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
    </div>
  );
}