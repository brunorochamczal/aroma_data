import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js'; // <-- IMPORTANTE: importar as rotas

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://aroma-data.onrender.com',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROTAS =====
// Rotas de autenticação (PRECISAM vir antes das rotas genéricas)
app.use('/api/auth', authRoutes); // <-- ISSO ESTÁ FALTANDO!

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
      health: '/api/health'
    }
  });
});

// ===== Tratamento de erros =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// 404 handler (deve ser o último)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📌 Rotas disponíveis:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/auth/me`);
});
