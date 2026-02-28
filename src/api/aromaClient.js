// src/api/aromaCliente.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

auth: {
  login: async (email, password) => {
    console.log('aromaClient: Chamando API de login');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('aromaClient: Resposta da API:', data);
    
    if (!response.ok) {
      throw data;
    }
    
    return data;
  },
  
}

export const aroma = {
  vendas: {
    listar: async () => {
      const response = await fetch(`${API_URL}/vendas`);
      return response.json();
    },
    criar: async (dados) => {
      const response = await fetch(`${API_URL}/vendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      return response.json();
    }
  }
  // Adicione mais métodos conforme necessário
};
