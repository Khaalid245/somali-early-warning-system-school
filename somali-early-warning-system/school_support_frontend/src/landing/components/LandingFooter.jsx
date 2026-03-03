import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🎓</span>
              <span className="text-xl font-bold text-white">School Early Warning</span>
            </div>
            <p className="text-sm">Helping schools in Somalia identify and support struggling students early.</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block hover:text-white transition">Home</Link>
              <Link to="/about" className="block hover:text-white transition">About</Link>
              <Link to="/contact" className="block hover:text-white transition">Contact</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-sm">
              <p>📞 +252 61 234 5678</p>
              <p>✉️ info@schoolwarning.so</p>
              <p>📍 Mogadishu, Somalia</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>© 2025 School Early Warning System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
