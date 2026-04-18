import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('procureseal_token'));
  const [requires2FA, setRequires2FA] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a stored token and fetch user
  useEffect(() => {
    const storedUser = localStorage.getItem('procureseal_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted stored data
      }
      // Verify token is still valid
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('procureseal_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          // Token expired
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;

    // Handle Forced Password Change
    if (data.requires_password_change) {
      localStorage.setItem('procureseal_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRequiresPasswordChange(true);
      return { requiresPasswordChange: true, user: data.user };
    }

    if (data.requires_2fa) {
      // Store temporary token for 2FA verification
      localStorage.setItem('procureseal_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRequires2FA(true);
      return { requires2FA: true, devOtp: data.dev_otp, user: data.user };
    }

    // Full login
    localStorage.setItem('procureseal_token', data.token);
    localStorage.setItem('procureseal_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setRequires2FA(false);
    setRequiresPasswordChange(false);
    return { requires2FA: false, requiresPasswordChange: false, user: data.user };
   
   
  }, []);

  const forceChangePassword = useCallback(async (newPassword, passwordConfirmation) => {
    const res = await api.post('/auth/change-password', { 
      password: newPassword, 
      password_confirmation: passwordConfirmation 
    });
    const data = res.data;

    // Update global state
    setRequiresPasswordChange(false);

    if (data.requires_2fa) {
      localStorage.setItem('procureseal_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRequires2FA(true);
      return { requires2FA: true, devOtp: data.dev_otp, user: data.user };
    }

    // Full login complete
    localStorage.setItem('procureseal_token', data.token);
    localStorage.setItem('procureseal_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return { requires2FA: false, user: data.user };
  }, []);

  const verify2FA = useCallback(async (otp) => {
    const res = await api.post('/auth/verify-2fa', { otp });
    const data = res.data;

    localStorage.setItem('procureseal_token', data.token);
    localStorage.setItem('procureseal_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setRequires2FA(false);
    return data.user;
   
   
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
    localStorage.removeItem('procureseal_token');
    localStorage.removeItem('procureseal_user');
    setToken(null);
    setUser(null);
    setRequires2FA(false);
    setRequiresPasswordChange(false);
   
   
  }, []);

  const value = {
    user,
    token,
    loading,
    requires2FA,
    requiresPasswordChange,
    isAuthenticated: !!token && !!user && !requires2FA && !requiresPasswordChange,
    login,
    forceChangePassword,
    verify2FA,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
