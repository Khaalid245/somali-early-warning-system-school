import { Link } from 'react-router-dom';
import { GraduationCap, Phone, Mail, MapPin } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-green-500" />
              <span className="text-xl font-semibold text-white">School Early Warning</span>
            </div>
            <p className="text-sm">Helping schools in Somalia identify and support struggling students early.</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block hover:text-green-400 transition">Home</Link>
              <Link to="/about" className="block hover:text-green-400 transition">About</Link>
              <Link to="/contact" className="block hover:text-green-400 transition">Contact</Link>
              <Link to="/privacy-policy" className="block hover:text-green-400 transition">Privacy Policy</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span>+252 61 234 5678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500" />
                <span>alifmonitor8@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span>Mogadishu, Somalia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-8 text-center text-sm">
          <p>© 2025 School Early Warning System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
