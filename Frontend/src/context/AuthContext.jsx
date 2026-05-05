import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('water_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('water_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('water_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('water_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    toast.success('Welcome back');
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem('water_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    toast.success('Account created');
  };

  const logout = () => {
    localStorage.removeItem('water_user');
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    darkMode,
    setDarkMode,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user)
  }), [user, loading, darkMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
