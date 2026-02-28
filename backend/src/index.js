import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// LOGS para debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ===== ROTAS =====
console.log('📌 Registrando rotas...');

// Rota de teste básica
app.get('/teste', (req, res) => {
  res.json({ message: 'Rota de teste funcionando!' });
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Aroma Data API funcionando!'
  });
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);
console.log('✅ Rotas de autenticação registradas em /api/auth');

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Aroma Data API',
    version: '1.0.0',
    endpoints: {
      test: '/teste',
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📌 Rotas disponíveis:`);
  console.log(`   - GET  /`);
  console.log(`   - GET  /teste`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/auth/me`);
});
