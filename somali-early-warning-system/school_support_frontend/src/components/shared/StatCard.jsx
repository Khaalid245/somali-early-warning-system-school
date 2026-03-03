export default function StatCard({ icon, title, value, subtitle, gradient, trend }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{icon}</span>
        {trend && (
          <span className="text-sm font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-white opacity-90 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
    </div>
  );
}
