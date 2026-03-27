import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Database, FileText, Users, UserCheck, UserCog } from 'lucide-react';
import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero Section */}
      <section className="bg-green-50 border-b border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Student data protection and FERPA compliance
          </p>
          <p className="text-sm text-gray-500 mt-4">Last Updated: January 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              This Privacy Policy explains how the Early Warning System collects, uses, and protects student education records in compliance with FERPA and applicable data protection laws.
            </p>
          </div>

          {/* FERPA Compliance */}
          <div className="mb-12 bg-green-50 border border-green-200 rounded-xl p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">FERPA Compliance</h3>
                <p className="text-gray-700">
                  This system is fully compliant with the Family Educational Rights and Privacy Act (FERPA). We protect student education records and ensure proper access controls.
                </p>
              </div>
            </div>
          </div>

          {/* Data Collection */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">1. Data We Collect</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Student Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Full name and student ID</li>
                  <li>Classroom and grade level</li>
                  <li>Attendance records</li>
                  <li>Academic alerts and risk indicators</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Staff Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Name and email address</li>
                  <li>Role (Teacher, Form Master, Administrator)</li>
                  <li>Assigned classes and subjects</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Data */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">2. How We Use Data</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <p className="text-gray-600 mb-4">Student data is used exclusively for:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>Attendance tracking</li>
                <li>Early warning detection</li>
                <li>Intervention planning</li>
                <li>Educational reporting</li>
              </ul>
              <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-700"><strong>Important:</strong> We do NOT sell or share student data with third parties.</p>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">3. Who Can Access Data</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-green-600 pl-6 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Teachers</h3>
                </div>
                <p className="text-gray-600">Can view attendance for their assigned classes only</p>
              </div>
              <div className="border-l-4 border-green-600 pl-6 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Form Masters</h3>
                </div>
                <p className="text-gray-600">Can access data for their assigned classroom only</p>
              </div>
              <div className="border-l-4 border-green-600 pl-6 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <UserCog className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Administrators</h3>
                </div>
                <p className="text-gray-600">Have system-wide access for oversight</p>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">4. Data Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Encryption</h3>
                </div>
                <p className="text-gray-600">All data is encrypted in transit and at rest</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Authentication</h3>
                </div>
                <p className="text-gray-600">Secure JWT-based authentication</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
                </div>
                <p className="text-gray-600">All activities logged for 7 years</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Backups</h3>
                </div>
                <p className="text-gray-600">Daily encrypted backups</p>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">5. Data Retention</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-semibold">•</span>
                  <span><strong>Attendance Records:</strong> Retained for 7 years</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-semibold">•</span>
                  <span><strong>Intervention Cases:</strong> Retained for 7 years</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-semibold">•</span>
                  <span><strong>Audit Logs:</strong> Retained for 7 years (FERPA requirement)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">6. Contact Information</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <p className="text-gray-600 mb-4">For questions about this Privacy Policy:</p>
              <div className="space-y-2 text-gray-900">
                <p><strong>Email:</strong> <a href="mailto:privacy@school.edu" className="text-green-600 hover:underline">privacy@school.edu</a></p>
                <p><strong>Phone:</strong> <a href="tel:+252123456789" className="text-green-600 hover:underline">+252 12 345 6789</a></p>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-green-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-semibold mb-4">Your Privacy Matters</h3>
            <p className="text-lg mb-6 text-green-50">
              We are committed to protecting student data and maintaining the highest standards of privacy and security.
            </p>
            <Link 
              to="/help-support" 
              className="inline-block px-8 py-3 bg-white text-green-600 font-medium rounded-lg hover:shadow-xl transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
