import { query } from '../config/database.js';
import { Produto } from './Produto.js';

export const Venda = {
  // LISTAR todas as vendas
  async findAll() {
    try {
      const result = await query(
        'SELECT * FROM vendas ORDER BY created_at DESC'
      );
      
      // Buscar itens de cada venda
      for (const venda of result.rows) {
        const itensResult = await query(
          'SELECT * FROM venda_itens WHERE venda_id = $1',
          [venda.id]
        );
        venda.itens = itensResult.rows;
      }
      
      return result.rows;
    } catch (error) {
      console.error('❌ Erro em Venda.findAll:', error);
      throw error;
    }
  },

  // BUSCAR por ID
  async findById(id) {
    try {
      const vendaResult = await query('SELECT * FROM vendas WHERE id = $1', [id]);
      const venda = vendaResult.rows[0];
      
      if (venda) {
        const itensResult = await query(
          'SELECT * FROM venda_itens WHERE venda_id = $1',
          [id]
        );
        venda.itens = itensResult.rows;
      }
      
      return venda;
    } catch (error) {
      console.error('❌ Erro em Venda.findById:', error);
      throw error;
    }
  },

  // CRIAR venda
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
      console.error('❌ Erro em Venda.create:', error);
      throw error;
    }
  },

  // EXCLUIR venda (DELETE REAL)
  async delete(id) {
    try {
      // Primeiro deletar os itens da venda
      await query('DELETE FROM venda_itens WHERE venda_id = $1', [id]);
      
      // Depois deletar a venda
      const result = await query('DELETE FROM vendas WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Venda.delete:', error);
      throw error;
    }
  }
};
