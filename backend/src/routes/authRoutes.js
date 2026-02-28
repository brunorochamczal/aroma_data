// Na rota de login, adicione logs:
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    console.log('🔐 [LOGIN] Requisição recebida:', { 
      email: req.body.email,
      hasPassword: !!req.body.password 
    });
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('🔐 [LOGIN] Erros de validação:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      console.log('🔐 [LOGIN] Buscando usuário no banco:', email);

      // Busca usuário
      const user = await User.findByEmail(email);
      console.log('🔐 [LOGIN] Usuário encontrado?', !!user);
      
      if (!user) {
        console.log('🔐 [LOGIN] Usuário não encontrado');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Valida senha
      console.log('🔐 [LOGIN] Validando senha...');
      const isValid = await User.validatePassword(user, password);
      console.log('🔐 [LOGIN] Senha válida?', isValid);
      
      if (!isValid) {
        console.log('🔐 [LOGIN] Senha inválida');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Gera tokens
      console.log('🔐 [LOGIN] Gerando tokens...');
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Salva refresh token no Redis
      await client.setEx(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

      // Remove senha do objeto user
      delete user.password;

      console.log('🔐 [LOGIN] Login bem-sucedido para:', email);
      res.json({
        user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('🔐 [LOGIN] Erro:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
