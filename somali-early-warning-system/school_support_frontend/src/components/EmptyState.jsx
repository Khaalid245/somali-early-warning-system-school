export default function EmptyState({ icon = "📭", title, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
