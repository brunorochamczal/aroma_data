import { query } from '../config/database.js';

export const Cliente = {
  // LISTAR todos os clientes ativos
  async findAll() {
    try {
      const result = await query(
        'SELECT * FROM clientes ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Erro em Cliente.findAll:', error);
      throw error;
    }
  },

  // BUSCAR por ID
  async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM clientes WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Cliente.findById:', error);
      throw error;
    }
  },

  // CRIAR cliente
  async create(data) {
    const { nome, cpf, telefone, email, endereco, usuario_id } = data;
    
    try {
      const result = await query(
        `INSERT INTO clientes (nome, cpf, telefone, email, endereco, usuario_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [nome, cpf, telefone, email, endereco, usuario_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Cliente.create:', error);
      throw error;
    }
  },

  // ATUALIZAR cliente
  async update(id, data) {
    const { nome, cpf, telefone, email, endereco } = data;
    
    try {
      const result = await query(
        `UPDATE clientes 
         SET nome = $1, cpf = $2, telefone = $3, email = $4, endereco = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [nome, cpf, telefone, email, endereco, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Cliente.update:', error);
      throw error;
    }
  },

  // EXCLUIR cliente (DELETE REAL)
  async delete(id) {
    try {
      // Verificar se existem vendas associadas a este cliente
      const vendas = await query('SELECT id FROM vendas WHERE cliente_id = $1', [id]);
      
      if (vendas.rows.length > 0) {
        throw new Error('Cliente possui vendas associadas e não pode ser excluído');
      }
      
      // DELETE REAL do banco de dados
      const result = await query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em Cliente.delete:', error);
      throw error;
    }
  }
};
