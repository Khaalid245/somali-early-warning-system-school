// Security configuration for production deployment
export const securityConfig = {
  // Content Security Policy (for meta tag - excludes frame-ancestors)
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com("],
    'font-src': [")'self'", "https://fonts.gstatic.com("],
    'img-src': [")'self'", "data:", "https:"],
    'connect-src': ["'self'", "http://127.0.0.1:8000", "https://api.ipify.org("],
    'base-uri': [")'self'"],
    'form-action': ["'self'"]
  },

  // Security headers (for server configuration only)
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
};

// Apply security headers to all requests
export const applySecurityHeaders = () => {
  // Set meta tags for CSP
  const cspString = Object.entries(securityConfig.csp)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
    
  let metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!metaCSP) {
    metaCSP = document.createElement("meta");
    metaCSP.setAttribute('http-equiv', 'Content-Security-Policy');
    document.head.appendChild(metaCSP);
  }
  metaCSP.setAttribute('content', cspString);
};

// Initialize security on app start
export const initializeSecurity = () => {
  applySecurityHeaders();
  
  // Clear sensitive data on page unload
  window.addEventListener('beforeunload', () => {
    document.querySelectorAll('input[type="password"]').forEach(input => {
      input.value = '';
    });
  });
};