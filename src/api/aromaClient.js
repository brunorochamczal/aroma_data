// src/api/aromaClient.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Função auxiliar para requisições com autenticação
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
};

export const aroma = {
  // ==================== AUTENTICAÇÃO ====================
  auth: {
    login: async (email, password) => {
      return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },

    register: async (userData) => {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    me: async () => {
      return apiRequest('/auth/me');
    },

    logout: () => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  },

  // ==================== VENDAS ====================
  vendas: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/vendas${params ? `?${params}` : ''}`);
    },

    buscar: async (id) => {
      return apiRequest(`/vendas/${id}`);
    },

    criar: async (dados) => {
      return apiRequest('/vendas', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    cancelar: async (id) => {
      return apiRequest(`/vendas/${id}/cancelar`, {
        method: 'POST'
      });
    }
  },

  // ==================== CLIENTES ====================
  clientes: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/clientes${params ? `?${params}` : ''}`);
    },

    buscar: async (id) => {
      return apiRequest(`/clientes/${id}`);
    },

    criar: async (dados) => {
      return apiRequest('/clientes', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    atualizar: async (id, dados) => {
      return apiRequest(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
    },

    desativar: async (id) => {
      return apiRequest(`/clientes/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // ==================== PRODUTOS ====================
  produtos: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/produtos${params ? `?${params}` : ''}`);
    },

    buscar: async (id) => {
      return apiRequest(`/produtos/${id}`);
    },

    criar: async (dados) => {
      return apiRequest('/produtos', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    atualizar: async (id, dados) => {
      return apiRequest(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
    },

    desativar: async (id) => {
      return apiRequest(`/produtos/${id}`, {
        method: 'DELETE'
      });
    },

    atualizarEstoque: async (id, quantidade) => {
      return apiRequest(`/produtos/${id}/estoque`, {
        method: 'POST',
        body: JSON.stringify({ quantidade })
      });
    }
  },

  // ==================== FORNECEDORES ====================
  fornecedores: {
    listar: async (filtros = {}) => {
      const params = new URLSearchParams(filtros).toString();
      return apiRequest(`/fornecedores${params ? `?${params}` : ''}`);
    },

    buscar: async (id) => {
      return apiRequest(`/fornecedores/${id}`);
    },

    criar: async (dados) => {
      return apiRequest('/fornecedores', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    atualizar: async (id, dados) => {
      return apiRequest(`/fornecedores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
    },

    desativar: async (id) => {
      return apiRequest(`/fornecedores/${id}`, {
        method: 'DELETE'
      });
    }
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
