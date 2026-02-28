import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import client from '../config/redis.js';

const router = express.Router();

// Registro
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Verifica se usuário já existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Cria usuário
      const user = await User.create({ email, password, name });

      // Gera tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Salva refresh token no Redis
      await client.setEx(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

      res.status(201).json({
        user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Busca usuário
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Valida senha
      const isValid = await User.validatePassword(user, password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Gera tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Salva refresh token no Redis
      await client.setEx(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

      // Remove senha do objeto user
      delete user.password;

      res.json({
        user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verifica refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Verifica se token está no Redis
    const storedToken = await client.get(`refresh:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Gera novo access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Remove refresh token do Redis
    await client.del(`refresh:${req.user.id}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Me (usuário atual)
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

export default router;
