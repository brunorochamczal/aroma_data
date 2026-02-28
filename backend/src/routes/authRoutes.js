import express from 'express';

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
  
  // Por enquanto, retorna sucesso para teste
  res.json({ 
    success: true,
    message: 'Login endpoint funcionando',
    accessToken: 'fake-token-para-teste',
    user: {
      id: 1,
      email: req.body.email,
      name: 'Usuário Teste'
    }
  });
});

// ===== REGISTER =====
router.post('/register', (req, res) => {
  console.log('📝 Rota /api/auth/register foi chamada!');
  res.json({ 
    success: true,
    message: 'Register endpoint funcionando' 
  });
});

// ===== ME =====
router.get('/me', (req, res) => {
  console.log('👤 Rota /api/auth/me foi chamada!');
  res.json({ 
    id: 1,
    email: 'teste@email.com',
    name: 'Usuário Teste'
  });
});

export default router;
