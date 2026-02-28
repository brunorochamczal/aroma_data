import express from 'express';

const router = express.Router();

// Rota de teste
router.get('/teste', (req, res) => {
  res.json({ message: 'Rota auth/teste funcionando!' });
});

// Rota de login
router.post('/login', (req, res) => {
  console.log('🔐 Rota de login chamada!');
  res.json({ 
    message: 'Rota de login funcionando!',
    email: req.body.email 
  });
});

// Rota de registro
router.post('/register', (req, res) => {
  res.json({ message: 'Rota de register funcionando!' });
});

// Rota do usuário atual
router.get('/me', (req, res) => {
  res.json({ message: 'Rota me funcionando!' });
});

export default router;
