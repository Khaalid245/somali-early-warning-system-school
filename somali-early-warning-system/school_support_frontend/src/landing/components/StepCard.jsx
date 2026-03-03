export default function StepCard({ number, title, description, icon }) {
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <h4 className="text-lg font-bold text-gray-900">{title}</h4>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
