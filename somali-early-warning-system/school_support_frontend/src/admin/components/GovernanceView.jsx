import { useState } from 'react';
import { Shield, Users, School, UserPlus, BookOpen, GraduationCap, Book } from 'lucide-react';
import UserManagement from './UserManagement';
import ClassroomManagement from './ClassroomManagement';
import StudentManagement from './StudentManagement';
import SubjectManagement from './SubjectManagement';
import EnrollmentManagement from './EnrollmentManagement';
import TeacherAssignment from './TeacherAssignment';

export default function GovernanceView() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'classrooms', label: 'Classroom Management', icon: School },
    { id: 'students', label: 'Student Management', icon: GraduationCap },
    { id: 'subjects', label: 'Subject Management', icon: Book },
    { id: 'enrollments', label: 'Student Enrollment', icon: UserPlus },
    { id: 'assignments', label: 'Teacher Assignment', icon: BookOpen }
  ];

  // Debug logging
  console.log('GovernanceView: Rendering with', tabs.length, 'tabs');
  console.log('GovernanceView: Active tab is', activeTab);
  console.log('GovernanceView: Available tabs:', tabs.map(t => t.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Governance</h1>
        </div>
        <p className="text-gray-600">
          Centralized user provisioning, role assignment, and classroom management
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition min-w-max ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-0">
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
