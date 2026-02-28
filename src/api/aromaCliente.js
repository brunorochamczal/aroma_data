// Seu arquivo atual, mas modificado para chamar sua API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const aroma = {
  vendas: {
    listar: async (filtros = {}) => {
      const query = new URLSearchParams(filtros).toString();
      const response = await fetch(`${API_URL}/vendas?${query}`);
      return response.json();
    },
    
    buscar: async (id) => {
      const response = await fetch(`${API_URL}/vendas/${id}`);
      return response.json();
    },
    
    criar: async (dados) => {
      const response = await fetch(`${API_URL}/vendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      return response.json();
    },
    
    atualizar: async (id, dados) => {
      const response = await fetch(`${API_URL}/vendas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      return response.json();
    },
    
    deletar: async (id) => {
      const response = await fetch(`${API_URL}/vendas/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    }
  },
  
  clientes: {
    // Similar para clientes
    listar: async () => {
      const response = await fetch(`${API_URL}/clientes`);
      return response.json();
    }
  },
  
  auth: {
    login: async (email, senha) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      return response.json();
    }
  }
};
