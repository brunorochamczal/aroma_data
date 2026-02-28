import express from 'express';
import jwt from 'jsonwebtoken';

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

// ===== LOGIN =====
router.post('/login', (req, res) => {
  console.log('🔐 Rota /api/auth/login foi chamada!');
  console.log('📦 Dados recebidos:', req.body);
  
  // Buscar usuário no banco de dados (SIMULADO POR ENQUANTO)
  // Na vida real, você consultaria o banco aqui
  const user = {
    id: 1,
    email: req.body.email,
    name: 'Usuário Teste'
  };

  // Gera um JWT REAL
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'chave-secreta-temporaria',
    { expiresIn: '7d' }
  );

  console.log('✅ Token JWT gerado:', accessToken.substring(0, 30) + '...');
  
  res.json({ 
    success: true,
    message: 'Login realizado com sucesso',
    accessToken,
    user
  });
});

// ===== REGISTER =====
router.post('/register', (req, res) => {
  console.log('📝 Rota /api/auth/register foi chamada!');
  
  // Gera um JWT REAL para o novo usuário
  const accessToken = jwt.sign(
    { userId: Date.now(), email: req.body.email },
    process.env.JWT_SECRET || 'chave-secreta-temporaria',
    { expiresIn: '7d' }
  );
  
  res.json({ 
    success: true,
    message: 'Registro realizado com sucesso',
    accessToken,
    user: {
      id: Date.now(),
      email: req.body.email,
      name: req.body.name || 'Novo Usuário'
    }
  });
});

// ===== ME =====
router.get('/me', (req, res) => {
  console.log('👤 Rota /api/auth/me foi chamada!');
  
  // Pegar token do header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave-secreta-temporaria');
    console.log('✅ Token válido, usuário:', decoded.userId);
    
    res.json({ 
      id: decoded.userId,
      email: decoded.email || 'usuario@email.com',
      name: 'Usuário Autenticado'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
