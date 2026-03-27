import { Save } from 'lucide-react';

export const InputField = ({ label, type = 'text', value, onChange, placeholder, helperText }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {helperText && <span className="block text-xs text-gray-500 font-normal">{helperText}</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-colors"
    />
  </div>
);

export const CheckboxField = ({ label, checked, onChange, helperText }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-600"
    />
    <div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  </label>
);

export const SaveButton = ({ onClick, disabled, loading, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
  >
    <Save className="w-5 h-5" />
    {loading ? 'Saving...' : children}
  </button>
);

export const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Icon className="w-6 h-6 text-green-600" />
      {title}
    </h2>
    {children}
  </div>
);

export const InfoBox = ({ type = 'info', icon: Icon, title, message }) => {
  const styles = {
    info: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${styles[type]}`}>
      {title && <h3 className="font-semibold mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        {title}
      </h3>}
      <p className="text-sm">{message}</p>
    </div>
  );
};
