import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js'; // NOVO
import produtoRoutes from './routes/produtoRoutes.js'; // NOVO
import { authenticate } from './middleware/auth.js'; // NOVO

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://aroma-data.onrender.com',
  credentials: true
}));
app.use(express.json());

// Logs para debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ===== ROTAS PÚBLICAS =====
app.use('/api/auth', authRoutes);

// ===== ROTAS PROTEGIDAS (exigem token) =====
app.use('/api/clientes', authenticate, clienteRoutes);
app.use('/api/produtos', authenticate, produtoRoutes);
// app.use('/api/vendas', authenticate, vendaRoutes); // Implementar depois

// Rota de teste
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

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Aroma Data API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      clientes: '/api/clientes',
      produtos: '/api/produtos',
      health: '/api/health'
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
  console.log(`   - GET  /api/clientes`);
  console.log(`   - POST /api/clientes`);
  console.log(`   - GET  /api/produtos`);
  console.log(`   - POST /api/produtos`);
});
