// Design System Tokens - Enterprise-grade design foundation

export const tokens = {
  // 8px Grid Spacing System
  spacing: {
    0: '0',
    1: '0.5rem',   // 8px
    2: '1rem',     // 16px
    3: '1.5rem',   // 24px
    4: '2rem',     // 32px
    5: '2.5rem',   // 40px
    6: '3rem',     // 48px
    8: '4rem',     // 64px
  },

  // Semantic Color System - Risk-based
  colors: {
    // Status Colors
    safe: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      border: 'border-green-200',
      hover: 'hover:bg-green-100'
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      border: 'border-yellow-200',
      hover: 'hover:bg-yellow-100'
    },
    attention: {
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-200',
      hover: 'hover:bg-orange-100'
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-200',
      hover: 'hover:bg-red-100'
    },
    neutral: {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      border: 'border-slate-200',
      hover: 'hover:bg-slate-100'
    }
  },

  // Button Hierarchy
  buttons: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-medium rounded-lg px-4 py-2.5 transition-all',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-4 focus:ring-slate-200 font-medium rounded-lg px-4 py-2.5 transition-all',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-200 font-medium rounded-lg px-4 py-2.5 transition-all',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-4 focus:ring-slate-200 font-medium rounded-lg px-4 py-2.5 transition-all'
  },

  // Typography Scale
  typography: {
    h1: 'text-3xl font-bold text-slate-900',
    h2: 'text-2xl font-bold text-slate-900',
    h3: 'text-xl font-semibold text-slate-900',
    body: 'text-base text-slate-700',
    small: 'text-sm text-slate-600',
    tiny: 'text-xs text-slate-500',
    metric: 'text-4xl font-bold text-slate-900'
  },

  // Border Radius
  radius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    none: 'shadow-none'
  }
};

// Supportive Language Mapping
export const supportiveLanguage = {
  'High-Risk Students': 'Students Needing Support',
  'Critical': 'Needs Immediate Attention',
  'High Risk': 'Priority Support',
  'At Risk': 'Needs Attention',
  'Failed': 'Needs Review',
  'Escalate': 'Request Additional Support'
};
