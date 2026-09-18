import React, { createContext, useContext, useState, useEffect } from 'react';
import { airGuardApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('airguard_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.token) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await airGuardApi.login(email, password);
    if (res.data) {
      setUser(res.data);
      localStorage.setItem('airguard_auth', JSON.stringify(res.data));
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await airGuardApi.register(name, email, password);
    if (res.data) {
      setUser(res.data);
      localStorage.setItem('airguard_auth', JSON.stringify(res.data));
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('airguard_auth');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
