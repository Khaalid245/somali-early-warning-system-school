import { Link } from 'react-router-dom';

export default function RoleCard({ icon, title, description, color, path }) {
  return (
    <Link
      to={path}
      className={`bg-gradient-to-br ${color} text-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
    >
      <div className="text-center">
        <div className="text-5xl sm:text-6xl mb-4">{icon}</div>
        <h3 className="text-xl sm:text-2xl font-bold mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-white/90 mb-4">{description}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold">
          <span>Sign In</span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}
