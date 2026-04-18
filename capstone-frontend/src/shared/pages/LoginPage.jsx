import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { resolveRoleRedirectPath } from '../../utils/rolePaths';

export default function LoginPage() {
  const { login, verify2FA, requires2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.requiresPasswordChange) {
        navigate('/force-password-change', { replace: true });
        return;
      }
      if (result.requires2FA) {
        setDevOtp(result.devOtp || '');
      } else {
        navigate(resolveRoleRedirectPath(from, result.user?.role?.name), { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const verifiedUser = await verify2FA(otp);
      navigate(resolveRoleRedirectPath(from, verifiedUser?.role?.name), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">ProcureSeal</h1>
          <p className="text-blue-600/70 text-sm mt-1 font-medium">Blockchain-Based Procurement Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-7">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {requires2FA ? 'Two-Factor Authentication' : 'Sign In'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {requires2FA
              ? 'Enter the 6-digit code sent to your email'
              : 'Enter your credentials to access the system'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Dev OTP Notice */}
          {devOtp && requires2FA && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <span className="font-semibold">Dev Mode OTP:</span> {devOtp}
            </div>
          )}

          {!requires2FA ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                  placeholder="user@procureseal.gov.ph"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition pr-11"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          ) : (
            /* 2FA OTP Form */
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-center text-xl tracking-[0.5em] font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : 'Verify Code'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          ProcureSeal v1.0.0 · Under RA 12009 · Government Procurement Reform Act
        </p>
      </div>
    </div>
  );
}
