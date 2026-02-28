import { query } from '../config/database.js';

export const Produto = {
  async create(data) {
    const { 
      nome, marca, volume, preco_custo, preco_venda, 
      estoque_atual, estoque_minimo, fornecedor_id, usuario_id 
    } = data;
    
    const result = await query(
      `INSERT INTO produtos (
        nome, marca, volume, preco_custo, preco_venda, 
        estoque_atual, estoque_minimo, fornecedor_id, usuario_id, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [nome, marca, volume, preco_custo, preco_venda, estoque_atual, estoque_minimo, fornecedor_id, usuario_id]
    );
    
    return result.rows[0];
  },

  async findAll(filters = {}) {
    let sql = 'SELECT p.*, f.nome as fornecedor_nome FROM produtos p LEFT JOIN fornecedores f ON p.fornecedor_id = f.id WHERE p.ativo = true';
    const values = [];
    let index = 1;

    if (filters.search) {
      sql += ` AND (p.nome ILIKE $${index} OR p.marca ILIKE $${index})`;
      values.push(`%${filters.search}%`);
      index++;
    }

    if (filters.lowStock) {
      sql += ` AND p.estoque_atual <= p.estoque_minimo`;
    }

    sql += ' ORDER BY p.created_date DESC';
    
    const result = await query(sql, values);
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      'SELECT p.*, f.nome as fornecedor_nome FROM produtos p LEFT JOIN fornecedores f ON p.fornecedor_id = f.id WHERE p.id = $1 AND p.ativo = true',
      [id]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { 
      nome, marca, volume, preco_custo, preco_venda, 
      estoque_atual, estoque_minimo, fornecedor_id 
    } = data;
    
    const result = await query(
      `UPDATE produtos 
       SET nome = $1, marca = $2, volume = $3, preco_custo = $4, preco_venda = $5,
           estoque_atual = $6, estoque_minimo = $7, fornecedor_id = $8, updated_at = NOW()
       WHERE id = $9 AND ativo = true
       RETURNING *`,
      [nome, marca, volume, preco_custo, preco_venda, estoque_atual, estoque_minimo, fornecedor_id, id]
    );
    
    return result.rows[0];
  },

  async updateStock(id, quantity, operation = 'add') {
    let sql;
    if (operation === 'add') {
      sql = 'UPDATE produtos SET estoque_atual = estoque_atual + $1, updated_at = NOW() WHERE id = $2 AND ativo = true RETURNING *';
    } else {
      sql = 'UPDATE produtos SET estoque_atual = estoque_atual - $1, updated_at = NOW() WHERE id = $2 AND ativo = true AND estoque_atual >= $1 RETURNING *';
    }
    
    const result = await query(sql, [quantity, id]);
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'UPDATE produtos SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};
