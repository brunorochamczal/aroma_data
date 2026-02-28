import React, { createContext, useState, useContext, useEffect } from 'react';
import { aroma } from '@/api/aromaClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    console.log('🔄 AuthProvider: Verificando autenticação...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    console.log('🔍 checkAuth: Token existe?', !!token);
    
    if (!token) {
      console.log('🔍 checkAuth: Sem token, usuário não autenticado');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 checkAuth: Validando token com /auth/me...');
      const userData = await aroma.auth.me();
      console.log('🔍 checkAuth: Resposta de /auth/me:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      console.log('🔍 checkAuth: Usuário autenticado com sucesso!');
    } catch (error) {
      console.error('🔍 checkAuth: Erro ao validar token:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔑 login: Iniciando login com email:', email);
    try {
      setIsLoading(true);
      setAuthError(null);
      
      console.log('🔑 login: Chamando aroma.auth.login...');
      const response = await aroma.auth.login(email, password);
      console.log('🔑 login: Resposta da API:', response);
      
      if (response.accessToken) {
        console.log('🔑 login: AccessToken recebido, salvando...');
        localStorage.setItem('token', response.accessToken);
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('🔑 login: Login bem-sucedido! isAuthenticated = true');
        return { success: true };
      } else {
        console.log('🔑 login: Resposta sem accessToken:', response);
        return { success: false, error: 'Resposta inválida do servidor' };
      }
    } catch (error) {
      console.error('🔑 login: Erro capturado:', error);
      setAuthError(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
      console.log('🔑 login: Finalizado, loading = false');
    }
  };

  const register = async (userData) => {
    console.log('📝 register: Iniciando registro com:', userData.email);
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await aroma.auth.register(userData);
      console.log('📝 register: Resposta da API:', response);
      
      if (response.accessToken) {
        console.log('📝 register: AccessToken recebido, salvando...');
        localStorage.setItem('token', response.accessToken);
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('📝 register: Registro e login bem-sucedidos!');
        return { success: true };
      } else {
        console.log('📝 register: Resposta sem accessToken');
        return { success: false, error: 'Resposta inválida do servidor' };
      }
    } catch (error) {
      console.error('📝 register: Erro capturado:', error);
      setAuthError(error.message || 'Erro ao registrar');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 logout: Fazendo logout');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    login,
    register,
    logout
  };

  console.log('📊 AuthProvider: Estado atual', { isAuthenticated, isLoading, user: user?.email });

  return (
    <AuthContext.Provider value={value}>
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
