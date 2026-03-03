import { useState, useContext, useEffect } from "react";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { showToast } from "../utils/toast";
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import LandingNav from "../landing/components/LandingNav";
import LandingFooter from "../landing/components/LandingFooter";
import TwoFactorModal from "../components/TwoFactorModal";

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
      const res = await api.post("/auth/login/", { email, password });

      // Check if 2FA is required
      if (res.status === 202 && res.data.requires_2fa) {
        setTempEmail(email);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      const access = res.data.access;
      const refresh = res.data.refresh;

      if (!access || !refresh) {
        setError("Invalid token response from server.");
        setLoading(false);
        return;
      }

      login(access, refresh);

      const decoded = jwtDecode(access);
      
      showToast.success(`Welcome back, ${decoded.username || 'User'}!`);

      if (decoded.role === "teacher") navigate("/teacher");
      else if (decoded.role === "form_master") navigate("/form-master");
      else if (decoded.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
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
    setShow2FA(false);
    
    if (!access || !refresh) {
      setError("Invalid token response from server.");
      return;
    }

    login(access, refresh);
    const decoded = jwtDecode(access);
    showToast.success(`Welcome back, ${decoded.username || 'User'}!`);

    if (decoded.role === "teacher") navigate("/teacher");
    else if (decoded.role === "form_master") navigate("/form-master");
    else if (decoded.role === "admin") navigate("/admin");
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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

      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
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
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
                >
                  <option value="teacher">Teacher</option>
                  <option value="form_master">Form Master</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12"
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
                  onClick={() => showToast.info('Contact your administrator to reset your password')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
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
