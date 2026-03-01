import { query } from '../config/database.js';
import { Produto } from './Produto.js';

export const Venda = {
  // LISTAR todas as vendas
  async findAll() {
    try {
      // Buscar vendas (exceto canceladas se quiser)
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

  // CRIAR venda (COM TRANSAÇÃO)
  async create(data) {
    const { 
      cliente_id, 
      cliente_nome, 
      itens, 
      valor_total, 
      desconto = 0, 
      valor_final,
      observacoes = '',
      usuario_id 
    } = data;

    console.log('📦 Venda.create - Dados recebidos:', {
      cliente_id,
      cliente_nome,
      valor_total,
      desconto,
      valor_final,
      usuario_id,
      qtdItens: itens?.length
    });

    // Validar itens
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new Error('A venda deve ter pelo menos um item');
    }

    // Inicia transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Inserir a venda
      const vendaResult = await client.query(
        `INSERT INTO vendas (
          cliente_id, 
          cliente_nome, 
          valor_total, 
          desconto, 
          valor_final, 
          observacoes, 
          usuario_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [cliente_id, cliente_nome, valor_total, desconto, valor_final, observacoes, usuario_id]
      );
      
      const venda = vendaResult.rows[0];
      console.log('✅ Venda criada com ID:', venda.id);

      // 2. Inserir itens e atualizar estoque
      for (const item of itens) {
        // Inserir item
        await client.query(
          `INSERT INTO venda_itens (
            venda_id, 
            produto_id, 
            produto_nome, 
            quantidade, 
            preco_unitario, 
            subtotal,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            venda.id, 
            item.produto_id, 
            item.produto_nome, 
            item.quantidade, 
            item.preco_unitario, 
            item.subtotal
          ]
        );

        // Atualizar estoque do produto (reduzir)
        await client.query(
          `UPDATE produtos 
           SET estoque_atual = estoque_atual - $1, 
               updated_at = NOW() 
           WHERE id = $2 AND estoque_atual >= $1`,
          [item.quantidade, item.produto_id]
        );

        // Registrar movimentação de estoque
        await client.query(
          `INSERT INTO movimentacoes_estoque (
            produto_id,
            produto_nome,
            tipo,
            quantidade,
            motivo,
            referencia_id,
            created_at
          ) VALUES ($1, $2, 'SAIDA', $3, 'VENDA', $4, NOW())`,
          [item.produto_id, item.produto_nome, item.quantidade, venda.id]
        );
      }

      await client.query('COMMIT');
      console.log('✅ Transação concluída com sucesso');
      
      // Retornar venda com itens
      venda.itens = itens;
      return venda;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro em Venda.create, transação cancelada:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // CANCELAR venda (restaurar estoque)
  async cancel(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar venda com itens
      const vendaResult = await client.query('SELECT * FROM vendas WHERE id = $1', [id]);
      const venda = vendaResult.rows[0];
      
      if (!venda) {
        throw new Error('Venda não encontrada');
      }

      if (venda.cancelada) {
        throw new Error('Venda já está cancelada');
      }

      // Buscar itens da venda
      const itensResult = await client.query(
        'SELECT * FROM venda_itens WHERE venda_id = $1',
        [id]
      );
      const itens = itensResult.rows;

      // Restaurar estoque de cada item
      for (const item of itens) {
        await client.query(
          `UPDATE produtos 
           SET estoque_atual = estoque_atual + $1, 
               updated_at = NOW() 
           WHERE id = $2`,
          [item.quantidade, item.produto_id]
        );

        // Registrar movimentação de estoque (entrada por cancelamento)
        await client.query(
          `INSERT INTO movimentacoes_estoque (
            produto_id,
            produto_nome,
            tipo,
            quantidade,
            motivo,
            referencia_id,
            created_at
          ) VALUES ($1, $2, 'ENTRADA', $3, 'CANCELAMENTO', $4, NOW())`,
          [item.produto_id, item.produto_nome, item.quantidade, id]
        );
      }

      // Marcar venda como cancelada
      await client.query(
        `UPDATE vendas 
         SET cancelada = true, 
             updated_at = NOW() 
         WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      return { ...venda, cancelada: true, itens };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro em Venda.cancel:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // EXCLUIR venda (DELETE REAL - só se permitido)
  async delete(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se venda pode ser excluída (não pode estar associada a outras coisas)
      // Por segurança, vamos apenas permitir se estiver cancelada
      const vendaResult = await client.query(
        'SELECT * FROM vendas WHERE id = $1',
        [id]
      );
      const venda = vendaResult.rows[0];

      if (!venda) {
        throw new Error('Venda não encontrada');
      }

      if (!venda.cancelada) {
        throw new Error('Apenas vendas canceladas podem ser excluídas');
      }

      // Deletar itens primeiro (ON DELETE CASCADE deve resolver, mas vamos garantir)
      await client.query('DELETE FROM venda_itens WHERE venda_id = $1', [id]);
      
      // Deletar venda
      const result = await client.query(
        'DELETE FROM vendas WHERE id = $1 RETURNING *',
        [id]
      );

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro em Venda.delete:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};

// Importar pool no início do arquivo
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
