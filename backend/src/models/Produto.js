import { query } from '../config/database.js';

export const Produto = {
  // LISTAR todos os produtos
  async findAll() {
    try {
      const result = await query(
        `SELECT p.*, f.nome as fornecedor_nome 
         FROM produtos p 
         LEFT JOIN fornecedores f ON p.fornecedor_id = f.id 
         ORDER BY p.created_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Erro em Produto.findAll:', error);
      throw error;
    }
  },

  // BUSCAR por ID
  async findById(id) {
    try {
      const result = await query(
        `SELECT p.*, f.nome as fornecedor_nome 
         FROM produtos p 
         LEFT JOIN fornecedores f ON p.fornecedor_id = f.id 
         WHERE p.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Produto.findById:', error);
      throw error;
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
      console.error('❌ Erro em Produto.create:', error);
      throw error;
    }
  },

  // ATUALIZAR produto
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
         WHERE id = $9
         RETURNING *`,
        [nome, marca, volume, preco_custo, preco_venda, estoque_atual, estoque_minimo, fornecedor_id, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Produto.update:', error);
      throw error;
    }
  },

  // ATUALIZAR ESTOQUE
  async updateStock(id, quantidade, operacao = 'add') {
    try {
      let sql;
      if (operacao === 'add') {
        sql = 'UPDATE produtos SET estoque_atual = estoque_atual + $1, updated_at = NOW() WHERE id = $2 RETURNING *';
      } else {
        sql = 'UPDATE produtos SET estoque_atual = estoque_atual - $1, updated_at = NOW() WHERE id = $2 AND estoque_atual >= $1 RETURNING *';
      }
      
      const result = await query(sql, [quantidade, id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Produto.updateStock:', error);
      throw error;
    }
  },

  // EXCLUIR produto (DELETE REAL)
  async delete(id) {
    try {
      // Verificar se existem vendas com este produto
      const vendas = await query(
        'SELECT vi.id FROM venda_itens vi WHERE vi.produto_id = $1 LIMIT 1',
        [id]
      );
      
      if (vendas.rows.length > 0) {
        throw new Error('Produto possui vendas associadas e não pode ser excluído');
      }
      
      // DELETE REAL
      const result = await query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Produto.delete:', error);
      throw error;
    }
  }
};
