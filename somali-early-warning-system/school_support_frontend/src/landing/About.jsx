import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">About Somali EWS</h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            Empowering schools to identify and support at-risk students through data-driven early warning systems
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="border-l-4 border-blue-600 pl-6">
              <div className="text-sm font-semibold text-blue-600 mb-2">OUR MISSION</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Preventing Student Dropout Through Early Intervention</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In Somalia, too many students drop out of school without anyone noticing the warning signs. We believe every student deserves the support they need to succeed.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our mission is to empower schools with data-driven tools that identify at-risk students early through attendance monitoring—the earliest indicator of academic risk—and coordinate timely, effective interventions.
              </p>
            </div>

            {/* Vision */}
            <div className="border-l-4 border-purple-600 pl-6">
              <div className="text-sm font-semibold text-purple-600 mb-2">OUR VISION</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">A Future Where No Student Falls Through the Cracks</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We envision a Somalia where every school has the tools and systems to identify struggling students before it's too late, where teachers and administrators work together seamlessly to provide support, and where data-driven decision-making becomes the foundation of educational success.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By 2030, we aim to be the leading early warning system across East Africa, helping thousands of schools reduce dropout rates and improve student outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Monitor Attendance</h3>
              <p className="text-gray-600">Track daily attendance patterns and identify early warning signs of student disengagement</p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Calculate Risk</h3>
              <p className="text-gray-600">Automated risk scoring based on absence rates, consecutive absences, and behavioral patterns</p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Support Students</h3>
              <p className="text-gray-600">Coordinate interventions between teachers, form masters, and administrators</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Student-First</h3>
              </div>
              <p className="text-gray-600">Every decision we make prioritizes student success and wellbeing</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Community-Driven</h3>
              </div>
              <p className="text-gray-600">We work closely with schools, teachers, and families</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Data-Driven</h3>
              </div>
              <p className="text-gray-600">We measure our success by student outcomes and school impact</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🤲</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Culturally Respectful</h3>
              </div>
              <p className="text-gray-600">Built for Somali schools with deep respect for local culture and context</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Real-Time Monitoring</h3>
              <p className="text-sm text-gray-600">Track attendance daily with instant risk calculation</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Automated Alerts</h3>
              <p className="text-sm text-gray-600">System creates alerts when students reach high risk</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Role-Based Access</h3>
              <p className="text-sm text-gray-600">Separate dashboards for teachers, form masters, admins</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Intervention Management</h3>
              <p className="text-sm text-gray-600">Create and track intervention cases with progress notes</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Audit Logging</h3>
              <p className="text-sm text-gray-600">Complete activity history for FERPA compliance</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">✅ Report Generation</h3>
              <p className="text-sm text-gray-600">Export PDF, DOCX, and CSV reports</p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
