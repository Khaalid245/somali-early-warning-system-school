export default function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-white/90">{description}</p>
    </div>
  );
}
