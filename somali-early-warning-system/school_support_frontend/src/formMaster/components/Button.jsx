import { tokens } from '../utils/designTokens';

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  loading = false,
  className = '',
  type = 'button'
}) {
  const baseStyles = 'font-medium rounded-lg px-4 py-2.5 transition-all focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200 active:bg-blue-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-200 active:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200 active:bg-red-800',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-200 active:bg-slate-200'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-busy={loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : children}
    </button>
  );
}
