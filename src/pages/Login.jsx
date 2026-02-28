import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('1️⃣ Form submitted', { email, password, isLogin });
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        console.log('2️⃣ Tentando login com:', email);
        result = await login(email, password);
        console.log('3️⃣ Resultado do login:', result);
      } else {
        console.log('2️⃣ Tentando registro com:', { email, password, name });
        result = await register({ email, password, name });
        console.log('3️⃣ Resultado do registro:', result);
      }

      if (result?.success) {
        console.log('4️⃣ Sucesso! Redirecionando...');
        toast.success(isLogin ? 'Login realizado!' : 'Conta criada com sucesso!');
      } else {
        console.log('4️⃣ Erro retornado:', result?.error);
        toast.error(result?.error || 'Erro na autenticação');
      }
    } catch (error) {
      console.error('5️⃣ Exceção capturada:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      console.log('6️⃣ Finalizando, loading = false');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf5f0] via-[#f9ede8]/50 to-[#fdf5f0] p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border-[#e8c9bc]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69934d847f21bef6394c904f/101dec9a7_Aroma.png" 
              alt="Aroma Data" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-[#4a3728]">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="border-[#e8c9bc] focus:ring-[#C4967A]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="border-[#e8c9bc] focus:ring-[#C4967A]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="border-[#e8c9bc] focus:ring-[#C4967A]"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#C4967A] to-[#b07e63] hover:from-[#b07e63] hover:to-[#9e6e56] text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#C4967A] hover:underline"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
