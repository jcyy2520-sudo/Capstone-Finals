import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { resolveRoleRedirectPath } from '../../utils/rolePaths';

export default function ForceChangePasswordPage() {
  const { forceChangePassword, requiresPasswordChange, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Requirements checklist
  const reqs = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&#]/.test(password),
  };
  const isStrong = Object.values(reqs).every(Boolean);
  const isMatch = password === passwordConfirmation && password !== '';

  useEffect(() => {
    // If user somehow directly navigates here without the flag
    if (!requiresPasswordChange) {
      navigate('/login', { replace: true });
    }
  }, [requiresPasswordChange, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isStrong) {
      setError('Password does not meet the minimum strength requirements.');
      return;
    }
    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await forceChangePassword(password, passwordConfirmation);
      // Wait a tick to let AuthContext state update, then redirect
      if (!result.requires2FA) {
        navigate(resolveRoleRedirectPath(from, result.user?.role?.name), { replace: true });
      } else {
         // Even if 2FA is required, the context updates state and we might want to let the router handle it
         // But for smoothness we can directly navigate to dashboard which will redirect back to login (with 2FA pending)
         // Actually, if requires2FA is true, the user is NOT authenticated yet. AuthContext handles it. We can redirect to login where 2FA state is handled or just navigate.
         navigate('/login', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.password?.[0] || 'Password update failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 transform transition-all">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 text-amber-600 rounded-full">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-base font-semibold text-gray-900 mb-2 text-center">
            Update Required
          </h2>
          <p className="text-gray-500 text-sm mb-6 text-center">
            For security purposes, you must change your auto-generated temporary password before accessing the system.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-10"
                  placeholder="Enter new strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-10 ${
                    passwordConfirmation && !isMatch ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Repeat new password"
                />
                <button
                   type="button"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     {showConfirmPassword ? (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                     ) : (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                     )}
                   </svg>
                 </button>
              </div>
              {passwordConfirmation && !isMatch && (
                 <p className="text-red-500 text-xs mt-1.5 ml-1">Passwords do not match</p>
              )}
            </div>

            {/* Password Strength Indicator */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 mt-4">
              <p className="text-sm text-gray-700 font-medium mb-2">Password Requirements:</p>
              <ul className="text-xs space-y-2">
                <li className={`flex items-center gap-2 ${reqs.length ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${reqs.length ? 'bg-green-500' : 'bg-gray-300'}`}/> At least 12 characters
                </li>
                <li className={`flex items-center gap-2 ${reqs.upper ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${reqs.upper ? 'bg-green-500' : 'bg-gray-300'}`}/> Uppercase letter
                </li>
                <li className={`flex items-center gap-2 ${reqs.lower ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${reqs.lower ? 'bg-green-500' : 'bg-gray-300'}`}/> Lowercase letter
                </li>
                <li className={`flex items-center gap-2 ${reqs.number ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${reqs.number ? 'bg-green-500' : 'bg-gray-300'}`}/> A number
                </li>
                <li className={`flex items-center gap-2 ${reqs.special ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${reqs.special ? 'bg-green-500' : 'bg-gray-300'}`}/> Special character (@$!%*?&#)
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-1/3 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !isStrong || !isMatch}
                className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
