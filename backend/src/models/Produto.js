import { query } from '../config/database.js';

export const Produto = {
  // LISTAR todos os produtos
  async findAll() {
    try {
      const result = await query(
        'SELECT * FROM produtos WHERE ativo = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Erro em Produto.findAll:', error);
      return [];
    }
  },

  // CRIAR produto
  async create(data) {
    const { 
      nome, marca, volume, preco_custo, preco_venda, 
      estoque_atual, estoque_minimo, fornecedor_id, usuario_id 
    } = data;
    
    try {
      const result = await query(
        `INSERT INTO produtos (
          nome, marca, volume, preco_custo, preco_venda, 
          estoque_atual, estoque_minimo, fornecedor_id, usuario_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *`,
        [nome, marca, volume, preco_custo, preco_venda, estoque_atual, estoque_minimo, fornecedor_id, usuario_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Produto.create:', error);
      throw error;
    }
  },

  // BUSCAR por ID
  async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM produtos WHERE id = $1 AND ativo = true',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Produto.findById:', error);
      return null;
    }
  },

  // ATUALIZAR
  async update(id, data) {
    const { 
      nome, marca, volume, preco_custo, preco_venda, 
      estoque_atual, estoque_minimo, fornecedor_id 
    } = data;
    
    try {
      const result = await query(
        `UPDATE produtos 
         SET nome = $1, marca = $2, volume = $3, preco_custo = $4, preco_venda = $5,
             estoque_atual = $6, estoque_minimo = $7, fornecedor_id = $8, updated_at = NOW()
         WHERE id = $9 AND ativo = true
         RETURNING *`,
        [nome, marca, volume, preco_custo, preco_venda, estoque_atual, estoque_minimo, fornecedor_id, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Produto.update:', error);
      throw error;
    }
  },

  // DELETAR (soft delete)
  async delete(id) {
    try {
      const result = await query(
        'UPDATE produtos SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro em Produto.delete:', error);
      throw error;
    }
  }
};
