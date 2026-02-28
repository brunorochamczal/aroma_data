import { query } from '../config/database.js';

export const Fornecedor = {
  async findAll() {
    try {
      const result = await query(
        'SELECT * FROM fornecedores WHERE ativo = true ORDER BY nome'
      );
      return result.rows;
    } catch (error) {
      console.error('Erro em Fornecedor.findAll:', error);
      return [];
    }
  },

  async create(data) {
    const { nome, cnpj, telefone, email, endereco, usuario_id } = data;
    
    try {
      const result = await query(
        `INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, usuario_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [nome, cnpj, telefone, email, endereco, usuario_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Fornecedor.create:', error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM fornecedores WHERE id = $1 AND ativo = true',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Fornecedor.findById:', error);
      return null;
    }
  },

  async update(id, data) {
    const { nome, cnpj, telefone, email, endereco } = data;
    
    try {
      const result = await query(
        `UPDATE fornecedores 
         SET nome = $1, cnpj = $2, telefone = $3, email = $4, endereco = $5, updated_at = NOW()
         WHERE id = $6 AND ativo = true
         RETURNING *`,
        [nome, cnpj, telefone, email, endereco, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Fornecedor.update:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const result = await query(
        'UPDATE fornecedores SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Fornecedor.delete:', error);
      throw error;
    }
  }
};
