// src/api/aromaClient.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Função auxiliar para TODAS as requisições
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`📤 ${options.method || 'GET'} ${API_URL}${endpoint}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  console.log('📥 Resposta:', { status: response.status });

  if (!response.ok) {
    // Se for 401 e NÃO for rota de login, redireciona
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      console.log('🔒 Token inválido ou expirado, redirecionando para login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw data;
  }

  return data;
};

export const aroma = {
  // ==================== AUTENTICAÇÃO ====================
  auth: {
    login: async (email, password) => {
      console.log('🔐 Tentando login...');
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (data.accessToken) {
        console.log('✅ Token recebido, salvando...');
        localStorage.setItem('token', data.accessToken);
      }
      
      return data;
    },

    register: async (userData) => {
      console.log('📝 Tentando registro...');
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (data.accessToken) {
        console.log('✅ Token recebido, salvando...');
        localStorage.setItem('token', data.accessToken);
      }
      
      return data;
    },

    me: async () => {
      return apiRequest('/auth/me');
    },

    logout: () => {
      console.log('🚪 Fazendo logout');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  },

  // ==================== CLIENTES ====================
  clientes: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/clientes${params ? `?${params}` : ''}`);
    },
    // ... (mantenha o resto igual)
  },

  // ==================== PRODUTOS ====================
  produtos: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/produtos${params ? `?${params}` : ''}`);
    },
    // ... (mantenha o resto igual)
  },

  // ==================== FORNECEDORES ====================
  fornecedores: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/fornecedores${params ? `?${params}` : ''}`);
    },
    // ... (mantenha o resto igual)
  },

  // ==================== VENDAS ====================
  vendas: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/vendas${params ? `?${params}` : ''}`);
    },
    // ... (mantenha o resto igual)
  },

  // ==================== MOVIMENTAÇÕES ====================
  movimentacoes: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/movimentacoes${params ? `?${params}` : ''}`);
    },
    criar: async (dados) => {
      return apiRequest('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    }
  },

  // ==================== NOTIFICAÇÕES ====================
  notificacoes: {
    listar: async () => {
      return apiRequest('/notificacoes');
    },
    marcarLida: async (id) => {
      return apiRequest(`/notificacoes/${id}/ler`, {
        method: 'POST'
      });
    }
  }
};
