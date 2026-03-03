import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/90 backdrop-blur-lg shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-3xl">🎓</span>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Somali EWS</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition">About</Link>
            <Link to="/user-guide" className="text-gray-700 hover:text-blue-600 font-medium transition">User Guide</Link>
            <Link to="/help-support" className="text-gray-700 hover:text-blue-600 font-medium transition">Help</Link>
            <Link to="/login" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium">
              🚀 Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition px-4 py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition px-4 py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link to="/user-guide" className="text-gray-700 hover:text-blue-600 font-medium transition px-4 py-2" onClick={() => setMobileMenuOpen(false)}>User Guide</Link>
              <Link to="/help-support" className="text-gray-700 hover:text-blue-600 font-medium transition px-4 py-2" onClick={() => setMobileMenuOpen(false)}>Help</Link>
              <Link to="/login" className="mx-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium text-center" onClick={() => setMobileMenuOpen(false)}>
                🚀 Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
