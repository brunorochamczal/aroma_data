import React, { createContext, useState, useContext, useEffect } from 'react';
import { aroma } from '@/api/aromaClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userData = await aroma.auth.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await aroma.auth.login(email, password);
      
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await aroma.auth.register(userData);
      
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message || 'Erro ao registrar');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      authError,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
