import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token recebido:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido para usuário:', decoded.userId);
    console.log('👤 Dados do token:', decoded);

    // Adicionar isAdmin ao req.user
    req.user = { 
      id: decoded.userId, 
      email: decoded.email,
      isAdmin: decoded.isAdmin || false 
    };
    
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
