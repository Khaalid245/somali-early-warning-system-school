import { Link } from 'react-router-dom';
import { CheckCircle, Bell, Users, Lock, ClipboardCheck, Zap, ArrowRight, ChevronDown } from 'lucide-react';
import LandingNav from './components/LandingNav';
import LandingFooter from './components/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.jpg" 
            alt="School" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-green-900/70 to-gray-900/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-white space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full font-medium text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span>Early Warning System Active</span>
              </div>
              
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-semibold leading-tight">
                  <span className="block text-white drop-shadow-lg">Prevent Student</span>
                  <span className="block text-green-500 drop-shadow-lg">
                    Dropout Early
                  </span>
                </h1>
                
                {/* Subtitle */}
                <div className="flex items-start gap-3 text-lg sm:text-xl text-gray-100 leading-relaxed drop-shadow-md">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <p>Track attendance patterns, identify at-risk students, and intervene before it's too late.</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/login" 
                  className="group flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all shadow-lg"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/about" 
                  className="flex items-center gap-2 px-6 py-3 bg-transparent text-white font-medium rounded-lg border-2 border-white/50 hover:bg-white/10 hover:border-white transition-all"
                >
                  <span>Learn More</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div className="text-3xl font-semibold text-white">98%</div>
                  </div>
                  <div className="text-xs text-gray-300">Attendance Rate</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-green-400" />
                    <div className="text-3xl font-semibold text-white">24/7</div>
                  </div>
                  <div className="text-xs text-gray-300">Real-Time Alerts</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-green-400" />
                    <div className="text-3xl font-semibold text-white">100%</div>
                  </div>
                  <div className="text-xs text-gray-300">Secure Data</div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="lg:block hidden">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-white rounded-xl mb-4">
                    <Users className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Access Your Dashboard</h3>
                  <p className="text-gray-300">Select your role to continue</p>
                </div>

                <div className="space-y-3">
                  <Link to="/login?role=teacher" className="block group">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl hover:bg-white/20 hover:border-white/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">Teacher</div>
                          <div className="text-gray-300 text-sm">Track attendance daily</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>

                  <Link to="/login?role=form_master" className="block group">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl hover:bg-white/20 hover:border-white/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <ClipboardCheck className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">Form Master</div>
                          <div className="text-gray-300 text-sm">Manage interventions</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>

                  <Link to="/login?role=admin" className="block group">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl hover:bg-white/20 hover:border-white/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Lock className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">Administrator</div>
                          <div className="text-gray-300 text-sm">System oversight</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-white opacity-75">
            <span className="text-sm font-medium">Discover More</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-green-50 text-green-700 rounded-full font-medium text-sm mb-4 border border-green-200">
              POWERFUL FEATURES
            </div>
            <h2 className="text-4xl font-semibold text-gray-900 mb-4">
              Everything You Need to
              <span className="block text-gray-900">
                Support Student Success
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed for educators to track, analyze, and intervene effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <ClipboardCheck className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor student attendance in real-time with instant updates and automated alerts for concerning patterns.
              </p>
            </div>

            <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Automated risk detection identifies at-risk students early, enabling proactive intervention before it's too late.
              </p>
            </div>

            <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intervention Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Coordinate support efforts across teachers, counselors, and administrators with structured intervention workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-white text-gray-700 rounded-full font-medium text-sm mb-4 border border-gray-200">
              SIMPLE PROCESS
            </div>
            <h2 className="text-4xl font-semibold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Three simple steps to start supporting your students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="relative z-10">
              <div className="bg-white border-2 border-green-200 rounded-xl p-8 hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-2xl font-semibold text-white mb-6 mx-auto">
                  1
                </div>
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">Sign In</h3>
                <p className="text-gray-600 text-center">
                  Access the system with your school credentials. Each role has customized access.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="bg-white border-2 border-green-200 rounded-xl p-8 hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-2xl font-semibold text-white mb-6 mx-auto">
                  2
                </div>
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">Track & Monitor</h3>
                <p className="text-gray-600 text-center">
                  Record attendance, view alerts, and monitor student progress in real-time.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="bg-white border-2 border-green-200 rounded-xl p-8 hover:border-green-400 transition-all" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-2xl font-semibold text-white mb-6 mx-auto">
                  3
                </div>
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3 text-gray-900">Take Action</h3>
                <p className="text-gray-600 text-center">
                  Create interventions, coordinate support, and help students succeed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Access the system and start supporting your students today
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
