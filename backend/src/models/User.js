import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = {
  async create(userData) {
    const { email, password, name, googleId } = userData;
    
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const result = await query(
      `INSERT INTO users (email, password, name, google_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, name, created_at`,
      [email, hashedPassword, name, googleId]
    );
    
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByGoogleId(googleId) {
    const result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return result.rows[0];
  },

  async validatePassword(user, password) {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  },

  async updateRefreshToken(userId, refreshToken) {
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, userId]
    );
  },

  async findByRefreshToken(refreshToken) {
    const result = await query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
    return result.rows[0];
  }
};
