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
  const [completedSteps, setCompletedSteps] = useState({
    users: false,
    subjects: false,
    classrooms: false,
    students: false,
    enrollments: false,
    assignments: false
  });

  const tabs = [
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users,
      step: 1,
      description: 'Create admin, teachers, and form masters',
      required: true
    },
    { 
      id: 'subjects', 
      label: 'Subject Management', 
      icon: Book,
      step: 2,
      description: 'Add subjects like Math, English, Science',
      required: true
    },
    { 
      id: 'classrooms', 
      label: 'Classroom Management', 
      icon: School,
      step: 3,
      description: 'Create classrooms and assign form masters',
      required: true
    },
    { 
      id: 'students', 
      label: 'Student Management', 
      icon: GraduationCap,
      step: 4,
      description: 'Register students in the system',
      required: true
    },
    { 
      id: 'enrollments', 
      label: 'Student Enrollment', 
      icon: UserPlus,
      step: 5,
      description: 'Enroll students into classrooms',
      required: true
    },
    { 
      id: 'assignments', 
      label: 'Teacher Assignment', 
      icon: BookOpen,
      step: 6,
      description: 'Assign teachers to subjects and classrooms',
      required: true
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Setup Workflow</h1>
            <p className="text-gray-600 text-sm mt-1">Complete all 6 steps to configure the system</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="text-green-800 text-xs font-medium">Progress</div>
            <div className="text-green-600 text-2xl font-semibold">
              {Object.values(completedSteps).filter(Boolean).length}/6
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(Object.values(completedSteps).filter(Boolean).length / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Setup Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCompleted = completedSteps[tab.id];
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  isActive 
                    ? 'border-green-300 bg-green-50' 
                    : isCompleted
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={isActive ? { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' } : {}}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                        isCompleted ? 'bg-green-600 text-white font-semibold' : ''
                      }`}
                      style={!isCompleted ? { backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 600 } : {}}
                    >
                      {isCompleted ? '✓' : tab.step}
                    </div>
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-green-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
                <h3 className={`font-semibold text-base mb-1 ${
                  isActive ? 'text-green-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {tab.label}
                </h3>
                <p className="text-sm text-gray-600">{tab.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="bg-white rounded-lg" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              {tabs.find(t => t.id === activeTab) && (() => {
                const currentTab = tabs.find(t => t.id === activeTab);
                const Icon = currentTab.icon;
                return (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                      {currentTab.step}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{currentTab.label}</h2>
                      <p className="text-sm text-gray-600">{currentTab.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {activeTab !== 'users' && (
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Previous
                </button>
              )}
              {activeTab !== 'assignments' && (
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Next
                </button>
              )}
            </div>
          </div>
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
