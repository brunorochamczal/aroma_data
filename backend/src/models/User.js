import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = {
  async findAll() {
    try {
      const result = await query(
        'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Erro em User.findAll:', error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const result = await query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em User.findById:', error);
      throw error;
    }
  },

  async findByEmail(email) {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em User.findByEmail:', error);
      throw error;
    }
  },

  async create(userData) {
    const { email, password, name, googleId } = userData;
    
    try {
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      
      let queryText;
      let values;
      
      if (googleId) {
        queryText = `INSERT INTO users (email, password, name, google_id, created_at)
                     VALUES ($1, $2, $3, $4, NOW())
                     RETURNING id, email, name, created_at`;
        values = [email, hashedPassword, name, googleId];
      } else {
        queryText = `INSERT INTO users (email, password, name, created_at)
                     VALUES ($1, $2, $3, NOW())
                     RETURNING id, email, name, created_at`;
        values = [email, hashedPassword, name];
      }
      
      console.log('📝 User.create - Query:', queryText);
      console.log('📝 User.create - Values:', values);
      
      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em User.create:', error);
      throw error;
    }
  },

  async update(id, userData) {
    const { email, name, password } = userData;
    
    try {
      let queryText;
      let values;
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        queryText = `UPDATE users 
                     SET email = $1, name = $2, password = $3, updated_at = NOW()
                     WHERE id = $4
                     RETURNING id, email, name, created_at`;
        values = [email, name, hashedPassword, id];
      } else {
        queryText = `UPDATE users 
                     SET email = $1, name = $2, updated_at = NOW()
                     WHERE id = $3
                     RETURNING id, email, name, created_at`;
        values = [email, name, id];
      }
      
      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em User.update:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      // Verificar se usuário tem registros associados
      const clientes = await query('SELECT id FROM clientes WHERE usuario_id = $1 LIMIT 1', [id]);
      const produtos = await query('SELECT id FROM produtos WHERE usuario_id = $1 LIMIT 1', [id]);
      const vendas = await query('SELECT id FROM vendas WHERE usuario_id = $1 LIMIT 1', [id]);
      
      if (clientes.rows.length > 0 || produtos.rows.length > 0 || vendas.rows.length > 0) {
        throw new Error('Usuário possui registros associados e não pode ser excluído');
      }
      
      const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id, email, name',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro em User.delete:', error);
      throw error;
    }
  },

  async validatePassword(user, password) {
    try {
      if (!user.password) return false;
      return bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('❌ Erro em User.validatePassword:', error);
      return false;
    }
  }
};
