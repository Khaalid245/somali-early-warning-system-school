import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ClipboardList, Settings, ChevronDown } from 'lucide-react';
import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';

export default function UserGuide() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const roles = [
    { id: 'teacher', name: 'Teacher', icon: Users },
    { id: 'form_master', name: 'Form Master', icon: ClipboardList },
    { id: 'admin', name: 'Administrator', icon: Settings }
  ];

  const guideContent = {
    teacher: {
      title: 'Teacher Guide',
      description: 'Record attendance, create alerts, and monitor student progress',
      sections: [
        {
          id: 't1',
          title: 'Access Your Dashboard',
          steps: ['Navigate to login page', 'Enter email and password', 'Select "Teacher" role', 'Click Sign In']
        },
        {
          id: 't2',
          title: 'Record Daily Attendance',
          steps: ['Select class from dashboard', 'Choose attendance date', 'Mark students (Present/Absent/Late)', 'Submit attendance']
        },
        {
          id: 't3',
          title: 'Create Student Alerts',
          steps: ['Navigate to Create Alert', 'Select student', 'Choose alert type', 'Add description and submit']
        },
        {
          id: 't4',
          title: 'View Student Progress',
          steps: ['Access student list', 'Click student profile', 'Review attendance history', 'Track interventions']
        }
      ]
    },
    form_master: {
      title: 'Form Master Guide',
      description: 'Manage classroom, track risk indicators, and coordinate interventions',
      sections: [
        {
          id: 'f1',
          title: 'Access Classroom Dashboard',
          steps: ['Log in with credentials', 'View assigned classroom', 'Review statistics', 'Identify high-risk students']
        },
        {
          id: 'f2',
          title: 'Manage Intervention Cases',
          steps: ['Navigate to Interventions', 'Create new case', 'Assign type and priority', 'Track progress']
        },
        {
          id: 'f3',
          title: 'Monitor Risk Indicators',
          steps: ['Review risk dashboard', 'Analyze attendance trends', 'Identify behavior patterns', 'Generate reports']
        },
        {
          id: 'f4',
          title: 'Coordinate with Teachers',
          steps: ['Review teacher alerts', 'Communicate strategies', 'Track feedback', 'Update outcomes']
        }
      ]
    },
    admin: {
      title: 'Administrator Guide',
      description: 'Manage users, classrooms, and system-wide governance',
      sections: [
        {
          id: 'a1',
          title: 'User Management',
          steps: ['Go to Governance → Users', 'Click Create User', 'Enter details', 'Assign role']
        },
        {
          id: 'a2',
          title: 'Classroom Management',
          steps: ['Go to Governance → Classrooms', 'Create classroom', 'Assign form master', 'View enrollments']
        },
        {
          id: 'a3',
          title: 'Student Enrollment',
          steps: ['Access Student Enrollment', 'Select student and classroom', 'Confirm enrollment', 'Prevent duplicates']
        },
        {
          id: 'a4',
          title: 'Teacher Assignment',
          steps: ['Go to Teacher Assignment', 'Select teacher', 'Choose class and subject', 'Submit assignment']
        },
        {
          id: 'a5',
          title: 'System Analytics',
          steps: ['Access Control Center', 'Review analytics', 'Monitor audit logs', 'Generate reports']
        }
      ]
    }
  };

  const currentGuide = guideContent[selectedRole];

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">User Guide</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Step-by-step instructions to help you navigate the School Early Warning Support System
          </p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap justify-center gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm sm:text-base">{role.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{currentGuide.title}</h2>
          <p className="text-base sm:text-lg text-slate-600">{currentGuide.description}</p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {currentGuide.sections.map((section, index) => {
            const isOpen = openSections[section.id];
            return (
              <div key={section.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
                      {index + 1}
                    </div>
                    <h3 className="text-base sm:text-xl font-semibold text-slate-900 truncate">{section.title}</h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                    <div className="pl-0 sm:pl-14 space-y-3">
                      {section.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">Log in to access the system</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Go to Login
          </Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
