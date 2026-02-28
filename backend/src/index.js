import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js'; // <-- IMPORT CORRETO

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// LOGS para debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ===== ROTAS =====
app.use('/api/auth', authRoutes); // <-- REGISTRO CORRETO

app.get('/teste', (req, res) => {
  res.json({ message: 'Rota de teste funcionando!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Aroma Data API funcionando!'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Aroma Data API',
    endpoints: {
      test: '/teste',
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
