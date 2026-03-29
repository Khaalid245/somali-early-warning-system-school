import { useState, useContext, useEffect } from "react";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { showToast } from "../utils/toast";
import { Eye, EyeOff, AlertCircle, User, Users, Shield, Check } from 'lucide-react';
import LandingNav from "../landing/components/LandingNav";
import LandingFooter from "../landing/components/LandingFooter";
import TwoFactorModal from "../components/TwoFactorModal";
import ForgotPasswordModal from "./ForgotPasswordModal";

const ROLES = [
  { value: 'teacher',     label: 'Teacher',       icon: User },
  { value: 'form_master', label: 'Form Master',   icon: Users },
  { value: 'admin',       label: 'Administrator', icon: Shield },
];

function RolePicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
      <div className="flex flex-col gap-2">
        {ROLES.map(({ value: v, label, icon: Icon }) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex items-center justify-between w-full px-4 rounded-xl border transition-colors ${
                selected
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '48px' }}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${selected ? 'font-medium' : 'font-normal'}`}>{label}</span>
              </div>
              {selected && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(searchParams.get('role') || "teacher");
  const { login } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [show2FA, setShow2FA] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) {
      setRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, text: '', color: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strength = [
      { score: 0, text: '', color: '' },
      { score: 1, text: 'Very Weak', color: 'bg-red-500' },
      { score: 2, text: 'Weak', color: 'bg-orange-500' },
      { score: 3, text: 'Fair', color: 'bg-yellow-500' },
      { score: 4, text: 'Good', color: 'bg-blue-500' },
      { score: 5, text: 'Strong', color: 'bg-green-500' },
    ];

    setPasswordStrength(strength[score]);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('[Login] Attempting login with:', { email, hasPassword: !!password });
      
      // Force HTTP for localhost development
      const loginUrl = "/auth/login/";
      const res = await api.post(loginUrl, { email, password });
      
      console.log('[Login] Response status:', res.status, 'Data:', res.data);

      // Check if 2FA is required
      if (res.status === 202 && res.data.requires_2fa) {
        console.log('[Login] 2FA required for user');
        setTempEmail(email);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      const access = res.data.access;
      const refresh = res.data.refresh;

      if (!access || !refresh) {
        console.error('[Login] Missing tokens in response:', res.data);
        setError("Invalid token response from server.");
        setLoading(false);
        return;
      }

      console.log('[Login] Tokens received, logging in');
      login(access, refresh);

      const decoded = jwtDecode(access);
      console.log('[Login] Decoded token:', decoded);
      
      showToast.success(`Welcome back, ${decoded.username || decoded.name || 'User'}!`);

      if (decoded.role === "teacher") navigate("/teacher");
      else if (decoded.role === "form_master") navigate("/form-master");
      else if (decoded.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      console.error('[Login] Error:', err.response?.status, err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Invalid email or password";
      const remaining = err.response?.data?.remaining_attempts;
      
      setError(errorMsg);
      showToast.error(errorMsg);
      
      if (remaining !== undefined) {
        setRemainingAttempts(remaining);
        if (remaining === 0) {
          showToast.error('Account locked for 30 minutes');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerified = async (access, refresh) => {
    console.log('[Login] 2FA verified, tokens received');
    setShow2FA(false);
    
    if (!access || !refresh) {
      console.error('[Login] Missing tokens after 2FA');
      setError("Invalid token response from server.");
      return;
    }

    login(access, refresh);
    const decoded = jwtDecode(access);
    console.log('[Login] User logged in after 2FA:', decoded);
    showToast.success(`Welcome back, ${decoded.username || decoded.name || 'User'}!`);

    if (decoded.role === "teacher") navigate("/teacher");
    else if (decoded.role === "form_master") navigate("/form-master");
    else if (decoded.role === "admin") navigate("/admin");
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-green-50">
      <LandingNav />

      {show2FA && (
        <TwoFactorModal
          email={tempEmail}
          onVerified={handle2FAVerified}
          onCancel={() => {
            setShow2FA(false);
            setLoading(false);
          }}
        />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}

      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex flex-col items-center justify-center mb-4">
              <span className="text-4xl font-bold text-green-600">AlifMonitor</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <p className="text-xs text-red-600 mt-1">{remainingAttempts} attempts remaining</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Picker */}
              <RolePicker value={role} onChange={setRole} />

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition"
                  style={{ transition: 'all 0.2s' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.2)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition pr-12"
                    style={{ transition: 'all 0.2s' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(22,163,74,0.2)'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && passwordStrength.score > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-[70px]">{passwordStrength.text}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* Policy Agreement */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  id="policy-agree"
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="policy-agree" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                  I have read and agree to the{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">
                    Privacy Policy &amp; EULA
                  </a>
                  . By signing in, I acknowledge my data protection obligations under the Somalia Data Protection Act (Law No. 005 of 2023).
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !agreedToPolicy}
                className="w-full py-3.5 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#15803D')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#16A34A')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <span className="font-medium text-gray-700">Contact your administrator</span>
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
