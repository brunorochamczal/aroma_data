import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import client from '../config/redis.js';

const router = express.Router();

// ===== ROTA DE TESTE =====
router.get('/teste', (req, res) => {
  console.log('✅ Rota /api/auth/teste foi chamada!');
  res.json({ 
    success: true,
    message: 'Rota de teste do auth funcionando!',
    timestamp: new Date().toISOString()
  });
});

// ===== REGISTER =====
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
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Cria usuário
      const user = await User.create({ email, password, name });

      // Determinar se é admin (baseado no email)
      const isAdmin = email === 'admin@aromadata.com';

      // Gera tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          isAdmin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      // Salva refresh token no Redis
      await client.setEx(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

      console.log('📝 [REGISTER] Usuário criado com sucesso:', user.id);
      res.status(201).json({
        success: true,
        message: 'Registro realizado com sucesso',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin
        }
      });
    } catch (error) {
      console.error('📝 [REGISTER] Erro:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ===== LOGIN =====
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

      // Busca usuário no banco de dados
      const user = await User.findByEmail(email);
      console.log('🔐 [LOGIN] Usuário encontrado?', !!user);
      
      if (!user) {
        console.log('🔐 [LOGIN] Usuário não encontrado');
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Validar senha
      const isValid = await User.validatePassword(user, password);
      console.log('🔐 [LOGIN] Senha válida?', isValid);
      
      if (!isValid) {
        console.log('🔐 [LOGIN] Senha inválida');
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Determinar o nome correto baseado no email
      let displayName = user.name;
      const isAdmin = email === 'admin@aromadata.com';
      
      if (isAdmin) {
        displayName = 'Administrador';
      }

      // Gera token JWT
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          isAdmin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      // Salva refresh token no Redis
      await client.setEx(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

      console.log('🔐 [LOGIN] Login bem-sucedido para:', email);
      
      res.json({ 
        success: true,
        message: 'Login realizado com sucesso',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: displayName,
          isAdmin
        }
      });
    } catch (error) {
      console.error('🔐 [LOGIN] Erro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ===== REFRESH TOKEN =====
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

    // Busca usuário para verificar se ainda existe e pegar dados atualizados
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = user.email === 'admin@aromadata.com';

    // Gera novo access token
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        isAdmin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: isAdmin ? 'Administrador' : user.name,
        isAdmin
      }
    });
  } catch (error) {
    console.error('🔄 [REFRESH] Erro:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    res.status(500).json({ error: error.message });
  }
});

// ===== LOGOUT =====
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Decodificar para pegar o userId e remover do Redis
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await client.del(`refresh:${decoded.userId}`);
      } catch (err) {
        // Ignorar erro se token já estiver expirado
      }
    }
    
    res.json({ 
      success: true,
      message: 'Logout realizado com sucesso' 
    });
  } catch (error) {
    console.error('🚪 [LOGOUT] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ME (USUÁRIO ATUAL) =====
router.get('/me', async (req, res) => {
  console.log('👤 Rota /api/auth/me foi chamada!');
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido, usuário:', decoded.userId);
    
    // Buscar dados atualizados do usuário
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const isAdmin = user.email === 'admin@aromadata.com';
    
    res.json({ 
      id: user.id,
      email: user.email,
      name: isAdmin ? 'Administrador' : user.name,
      isAdmin
    });
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// ROTA TEMPORÁRIA PARA GERAR HASH (REMOVER DEPOIS)
router.post('/gerar-hash', async (req, res) => {
  const { senha } = req.body;
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(senha, 10);
  res.json({ senha, hash });
});

export default router;
