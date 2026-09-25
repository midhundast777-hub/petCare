import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = authService.getCurrentUser();
      
      if (token && storedUser) {
        setUser(storedUser);
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          localStorage.setItem('user_info', JSON.stringify(profile));
        } catch (err) {
          console.error("Session refresh failed", err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    localStorage.setItem('user_info', JSON.stringify(updated));
    return updated;
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
