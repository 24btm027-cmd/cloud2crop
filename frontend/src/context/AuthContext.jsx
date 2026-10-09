import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { post, put, del, setAuthToken } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('c2c_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist user to localStorage (offline cache)
  useEffect(() => {
    if (user) {
      localStorage.setItem('c2c_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('c2c_user');
    }
  }, [user]);

  // === OTP Flow ===

  const sendOtp = async (phone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await post('/auth/otp/send', { phone });
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to send OTP');
      throw err;
    }
  };

  const verifyOtp = async (phone, code, language) => {
    setLoading(true);
    setError(null);
    try {
      const res = await post('/auth/otp/verify', { phone, code, language });
      if (res.token) {
        setAuthToken(res.token);
        localStorage.setItem('c2c_token', res.token);
      }
      setUser(res.user);
      setLoading(false);
      return res; // { user, isNew }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'OTP verification failed');
      throw err;
    }
  };

  // === Legacy phone+password login (kept for backward compat) ===

  const login = async (phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await post('/auth/login', { phone, password });
      setAuthToken(res.token);
      setUser(res.user);
      setLoading(false);
      return res.user;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async ({ name, phone, password, language, location }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await post('/auth/signup', { name, phone, password, language, location });
      setAuthToken(res.token);
      setUser(res.user);
      setLoading(false);
      return res.user;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Signup failed');
      throw err;
    }
  };

  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await put('/profile', profileData);
      setUser(prev => ({ ...prev, ...res.user }));
      setLoading(false);
      return res.user;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Profile update failed');
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setLoading(true);
    try {
      await del('/profile');
      setUser(null);
      setAuthToken(null);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to delete account');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await post('/auth/logout', {}); } catch {}
    setUser(null);
    setAuthToken(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, sendOtp, verifyOtp, login, signup, updateProfile, deleteAccount, logout, clearError, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
