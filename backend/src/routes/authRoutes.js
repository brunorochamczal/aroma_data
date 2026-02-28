// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token recebido:', token.substring(0, 20) + '...');

    // Verifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido para usuário:', decoded.userId);

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Authentication error' });
  }
};
