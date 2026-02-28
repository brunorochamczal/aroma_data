import { query } from '../config/database.js';

export const Cliente = {
  async create(data) {
    const { nome, cpf, telefone, email, endereco, usuario_id } = data;
    
    const result = await query(
      `INSERT INTO clientes (nome, cpf, telefone, email, endereco, usuario_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [nome, cpf, telefone, email, endereco, usuario_id]
    );
    
    return result.rows[0];
  },

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM clientes WHERE ativo = true';
    const values = [];
    let index = 1;

    if (filters.search) {
      sql += ` AND (nome ILIKE $${index} OR email ILIKE $${index} OR cpf ILIKE $${index})`;
      values.push(`%${filters.search}%`);
      index++;
    }

    sql += ' ORDER BY created_date DESC';
    
    const result = await query(sql, values);
    return result.rows;
  },

  async findById(id) {
    const result = await query('SELECT * FROM clientes WHERE id = $1 AND ativo = true', [id]);
    return result.rows[0];
  },

  async update(id, data) {
    const { nome, cpf, telefone, email, endereco } = data;
    
    const result = await query(
      `UPDATE clientes 
       SET nome = $1, cpf = $2, telefone = $3, email = $4, endereco = $5, updated_at = NOW()
       WHERE id = $6 AND ativo = true
       RETURNING *`,
      [nome, cpf, telefone, email, endereco, id]
    );
    
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'UPDATE clientes SET ativo = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};
