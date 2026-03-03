export default function ActionButton({ icon, text, onClick, variant = "primary", disabled = false }) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} text-white px-6 py-3 rounded-lg font-semibold shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
    >
      {icon && <span className="text-xl">{icon}</span>}
      <span>{text}</span>
    </button>
  );
}
