import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Configuração da API - será substituída pela URL real quando criar o backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verificar se há token salvo ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Validar token com o backend
  const validateToken = async (token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Token inválido ou expirado
        localStorage.removeItem('token');
        setAuthError({
          type: 'invalid_token',
          message: 'Sessão expirada. Faça login novamente.'
        });
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setAuthError({
        type: 'connection_error',
        message: 'Erro de conexão com o servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função de login
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Erro ao fazer login'
        };
      }

      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      setAuthError({
        type: error.status === 401 ? 'invalid_credentials' : 'login_error',
        message: error.message || 'Erro ao fazer login'
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Erro ao registrar'
        };
      }

      // Se o registro retornar token automaticamente
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Register error:', error);
      setAuthError({
        type: 'register_error',
        message: error.message || 'Erro ao registrar'
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async (shouldRedirect = false) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Notificar backend sobre logout (opcional)
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout backend error:', error);
      }
    }

    // Limpar dados locais
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);

    // Redirecionar para login se necessário
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  // Função para redirecionar para login
  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  // Função para obter perfil do usuário atual
  const getProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Não autenticado');

      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar perfil');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      authError,
      login,
      register,
      logout,
      navigateToLogin,
      getProfile
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
