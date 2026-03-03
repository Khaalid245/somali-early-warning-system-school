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

  // Debug logging
  console.log('GovernanceView: Rendering with', tabs.length, 'tabs');
  console.log('GovernanceView: Active tab is', activeTab);
  console.log('GovernanceView: Available tabs:', tabs.map(t => t.id));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Progress Bar - Compact */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-3 md:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-base md:text-2xl font-bold text-white">Setup Workflow</h1>
            <p className="text-blue-100 text-xs md:text-sm hidden sm:block">Follow steps 1-6</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1 md:px-3 md:py-2">
            <div className="text-white text-xs font-semibold">Progress</div>
            <div className="text-white text-lg md:text-2xl font-bold">
              {Object.values(completedSteps).filter(Boolean).length}/6
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-blue-800 bg-opacity-30 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${(Object.values(completedSteps).filter(Boolean).length / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
        <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-4">📋 Setup Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCompleted = completedSteps[tab.id];
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-1.5 md:p-4 rounded md:rounded-lg border-2 text-left transition-all touch-manipulation ${
                  isActive 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : isCompleted
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-0.5 md:mb-1">
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <div className={`w-4 h-4 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-base flex-shrink-0 ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {isCompleted ? '✓' : tab.step}
                    </div>
                    <Icon className={`w-3 h-3 md:w-5 md:h-5 ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  {isCompleted && (
                    <span className="text-[10px] md:text-xs font-semibold text-green-600 bg-green-100 px-1 py-0.5 rounded">
                      ✓
                    </span>
                  )}
                </div>
                <h3 className={`font-semibold text-[11px] md:text-base leading-tight ${
                  isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {tab.label}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 hidden sm:block">{tab.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 bg-gray-50 px-3 md:px-6 py-2 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {tabs.find(t => t.id === activeTab) && (() => {
                const currentTab = tabs.find(t => t.id === activeTab);
                return (
                  <>
                    <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs md:text-lg flex-shrink-0">
                      {currentTab.step}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm md:text-xl font-bold text-gray-900 truncate">{currentTab.label}</h2>
                      <p className="text-xs text-gray-600 hidden md:block">{currentTab.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {activeTab !== 'users' && (
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  className="w-8 h-8 md:w-auto md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-md md:rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base flex items-center justify-center"
                >
                  <span className="md:hidden">←</span>
                  <span className="hidden md:inline">← Prev</span>
                </button>
              )}
              {activeTab !== 'assignments' && (
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                  }}
                  className="w-8 h-8 md:w-auto md:px-4 md:py-2 bg-blue-600 text-white rounded-md md:rounded-lg hover:bg-blue-700 transition font-medium text-sm md:text-base flex items-center justify-center"
                >
                  <span className="md:hidden">→</span>
                  <span className="hidden md:inline">Next →</span>
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
