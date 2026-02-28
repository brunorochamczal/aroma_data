import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
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
    console.log('📝 [REGISTER] Requisição recebida:', { email: req.body.email });
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('📝 [REGISTER] Erros de validação:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Verifica se usuário já existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log('📝 [REGISTER] Email já registrado:', email);
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

      console.log('📝 [REGISTER] Usuário criado com sucesso:', user.id);
      res.status(201).json({
        user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('📝 [REGISTER] Erro:', error);
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
    console.log('🔐 [LOGIN] Requisição recebida:', { email: req.body.email });
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('🔐 [LOGIN] Erros de validação:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Busca usuário
      const user = await User.findByEmail(email);
      console.log('🔐 [LOGIN] Usuário encontrado?', !!user);
      
      if (!user) {
        console.log('🔐 [LOGIN] Usuário não encontrado');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Valida senha
      const isValid = await User.validatePassword(user, password);
      console.log('🔐 [LOGIN] Senha válida?', isValid);
      
      if (!isValid) {
        console.log('🔐 [LOGIN] Senha inválida');
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

      console.log('🔐 [LOGIN] Login bem-sucedido para:', email);
      res.json({
        user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('🔐 [LOGIN] Erro:', error);
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const storedToken = await client.get(`refresh:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('🔄 [REFRESH] Erro:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await client.del(`refresh:${decoded.userId}`);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('🚪 [LOGOUT] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Me (usuário atual)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('👤 [ME] Erro:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: error.message });
  }
});

// EXPORTAÇÃO CORRETA (ES MODULES)
export default router;
