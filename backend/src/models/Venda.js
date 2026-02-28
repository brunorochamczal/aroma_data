import { query } from '../config/database.js';
import { Produto } from './Produto.js';

export const Venda = {
  async create(data) {
    const { 
      cliente_id, cliente_nome, itens, valor_total, 
      desconto, valor_final, observacoes, usuario_id 
    } = data;
    
    // Inicia uma transação
    await query('BEGIN');
    
    try {
      // Cria a venda
      const vendaResult = await query(
        `INSERT INTO vendas (
          cliente_id, cliente_nome, valor_total, desconto, 
          valor_final, observacoes, usuario_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [cliente_id, cliente_nome, valor_total, desconto, valor_final, observacoes, usuario_id]
      );
      
      const venda = vendaResult.rows[0];
      
      // Cria os itens da venda e atualiza estoque
      for (const item of itens) {
        await query(
          `INSERT INTO venda_itens (
            venda_id, produto_id, produto_nome, quantidade, 
            preco_unitario, subtotal, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [venda.id, item.produto_id, item.produto_nome, item.quantidade, item.preco_unitario, item.subtotal]
        );
        
        // Atualiza estoque do produto
        await Produto.updateStock(item.produto_id, item.quantidade, 'remove');
      }
      
      await query('COMMIT');
      return venda;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  },

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM vendas WHERE cancelada = false';
    const values = [];
    let index = 1;

    if (filters.startDate) {
      sql += ` AND created_date >= $${index}`;
      values.push(filters.startDate);
      index++;
    }

    if (filters.endDate) {
      sql += ` AND created_date <= $${index}`;
      values.push(filters.endDate);
      index++;
    }

    if (filters.cliente_id) {
      sql += ` AND cliente_id = $${index}`;
      values.push(filters.cliente_id);
      index++;
    }

    sql += ' ORDER BY created_date DESC';
    
    const result = await query(sql, values);
    
    // Busca os itens de cada venda
    for (const venda of result.rows) {
      const itensResult = await query('SELECT * FROM venda_itens WHERE venda_id = $1', [venda.id]);
      venda.itens = itensResult.rows;
    }
    
    return result.rows;
  },

  async findById(id) {
    const vendaResult = await query('SELECT * FROM vendas WHERE id = $1', [id]);
    const venda = vendaResult.rows[0];
    
    if (venda) {
      const itensResult = await query('SELECT * FROM venda_itens WHERE venda_id = $1', [id]);
      venda.itens = itensResult.rows;
    }
    
    return venda;
  },

  async cancel(id) {
    // Inicia transação
    await query('BEGIN');
    
    try {
      // Busca a venda com itens
      const venda = await this.findById(id);
      
      if (!venda || venda.cancelada) {
        await query('ROLLBACK');
        return null;
      }
      
      // Restaura estoque de cada item
      for (const item of venda.itens) {
        await Produto.updateStock(item.produto_id, item.quantidade, 'add');
      }
      
      // Marca venda como cancelada
      const result = await query(
        'UPDATE vendas SET cancelada = true, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      
      await query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
};
