import { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';

export default function TwoFactorSetup({ user, onClose }) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [password, setPassword] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/setup/');
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setStep(2);
    } catch (err) {
      showToast.error('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/2fa/enable/', { code });
      showToast.success('2FA enabled successfully');
      onClose(true);
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/2fa/disable/', { code });
      showToast.success('2FA disabled successfully');
      onClose(true);
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleForceReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/2fa/force-reset/', { password });
      showToast.success('2FA reset successfully. You can now set it up again.');
      onClose(true);
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  if (user?.two_factor_enabled) {
    if (showPasswordReset) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Reset 2FA</h3>
              <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Lost access to your authenticator app? Enter your password to reset 2FA.
              </p>
            </div>

            <form onSubmit={handleForceReset}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter your account password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Disable 2FA</h3>
            <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <span className="font-semibold">2FA is currently enabled</span>
            </div>
          </div>

          <form onSubmit={handleDisable}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter your 2FA code to disable
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                required
              />
            </div>

            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => onClose(false)}
                className="flex-1 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Lost access to authenticator app? Reset with password
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Setup 2FA</h3>
          <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <div>
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-center text-slate-600">
                Add an extra layer of security to your account with two-factor authentication
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-slate-700">Install an authenticator app (Google Authenticator, Authy)</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-slate-700">Scan the QR code with your app</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-slate-700">Enter the 6-digit code to verify</p>
              </div>
            </div>

            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleEnable}>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4 text-center">
                Scan this QR code with your authenticator app
              </p>
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 text-center mb-1">Or enter this code manually:</p>
                <p className="text-sm font-mono text-center text-slate-900 font-semibold">{secret}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter the 6-digit code from your app
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Enabling...' : 'Enable 2FA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
