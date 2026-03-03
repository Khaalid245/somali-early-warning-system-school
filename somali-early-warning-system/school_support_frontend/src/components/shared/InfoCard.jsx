export default function InfoCard({ icon, title, subtitle, children, headerGradient }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${headerGradient} p-6`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-white opacity-90">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
