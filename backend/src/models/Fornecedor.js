import { query } from '../config/database.js';

export const Fornecedor = {
  // LISTAR todos os fornecedores
  async findAll() {
    try {
      const result = await query(
        'SELECT * FROM fornecedores ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Erro em Fornecedor.findAll:', error);
      throw error;
    }
  },

  // BUSCAR por ID
  async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM fornecedores WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Fornecedor.findById:', error);
      throw error;
    }
  },

  // CRIAR fornecedor
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
      console.error('❌ Erro em Fornecedor.create:', error);
      throw error;
    }
  },

  // ATUALIZAR fornecedor
  async update(id, data) {
    const { nome, cnpj, telefone, email, endereco } = data;
    
    try {
      const result = await query(
        `UPDATE fornecedores 
         SET nome = $1, cnpj = $2, telefone = $3, email = $4, endereco = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [nome, cnpj, telefone, email, endereco, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Fornecedor.update:', error);
      throw error;
    }
  },

  // EXCLUIR fornecedor (DELETE REAL)
  async delete(id) {
    try {
      // Verificar se existem produtos deste fornecedor
      const produtos = await query(
        'SELECT id FROM produtos WHERE fornecedor_id = $1 LIMIT 1',
        [id]
      );
      
      if (produtos.rows.length > 0) {
        throw new Error('Fornecedor possui produtos associados e não pode ser excluído');
      }
      
      // DELETE REAL
      const result = await query('DELETE FROM fornecedores WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Fornecedor.delete:', error);
      throw error;
    }
  }
};
