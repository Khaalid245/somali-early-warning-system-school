import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, BookOpen, Shield, ChevronDown } from 'lucide-react';
import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';

export default function HelpSupport() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <div className="bg-green-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get the assistance you need to use the system effectively
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Contact IT Support</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <a href="mailto:support@school.edu" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-600 hover:shadow-lg transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-sm text-gray-600 mb-3">Response within 24 hours</p>
            <p className="text-green-600 font-medium">support@school.edu</p>
          </a>

          <a href="tel:+252123456789" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-600 hover:shadow-lg transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-sm text-gray-600 mb-3">Mon-Fri, 8AM-5PM</p>
            <p className="text-green-600 font-medium">+252 12 345 6789</p>
          </a>

          <div className="bg-white border border-gray-200 rounded-lg p-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Office</h3>
            <p className="text-sm text-gray-600 mb-3">Walk-in support</p>
            <p className="text-gray-700 font-medium">Building A, Room 101</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 border-y border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Common Questions</h2>

          <div className="space-y-4">
            <details className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                <span>I forgot my password</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-4 text-gray-600 space-y-2 border-t border-gray-100">
                <p className="font-medium text-gray-900 pt-4">Solution:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to the login page</li>
                  <li>Contact your administrator for password reset</li>
                  <li>You'll receive a temporary password via email</li>
                </ol>
              </div>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                <span>I can't log in to the system</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-4 text-gray-600 space-y-2 border-t border-gray-100">
                <p className="font-medium text-gray-900 pt-4">Check these:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Verify your email address is correct</li>
                  <li>Make sure you selected the correct role</li>
                  <li>Check if Caps Lock is on</li>
                  <li>Try clearing your browser cache</li>
                </ul>
              </div>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                <span>My data is not showing</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-4 text-gray-600 space-y-2 border-t border-gray-100">
                <p className="font-medium text-gray-900 pt-4">Try these steps:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Refresh the page (press F5)</li>
                  <li>Check if you selected the correct filters</li>
                  <li>Verify the date range</li>
                  <li>Contact IT support if issue persists</li>
                </ul>
              </div>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                <span>How do I submit attendance?</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-4 text-gray-600 space-y-2 border-t border-gray-100">
                <p className="font-medium text-gray-900 pt-4">Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Select your class from the dashboard</li>
                  <li>Choose the date</li>
                  <li>Mark each student (Present/Absent/Late)</li>
                  <li>Click Submit button</li>
                </ol>
              </div>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                <span>Who can create user accounts?</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
                <p>Only administrators can create user accounts. If you need an account, contact your school administrator or IT support.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">More Resources</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/user-guide" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-600 hover:shadow-lg transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Guide</h3>
                <p className="text-gray-600">Step-by-step instructions for all features</p>
              </div>
            </div>
          </Link>

          <Link to="/privacy-policy" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-600 hover:shadow-lg transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-600">Data protection and FERPA compliance</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-8">Our IT support team is ready to assist you</p>
          <a
            href="mailto:support@school.edu"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md"
          >
            <Mail className="w-5 h-5" />
            Email Support Team
          </a>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
