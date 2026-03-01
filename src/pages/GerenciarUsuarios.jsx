import React from "react";
import { useAuth } from '@/lib/AuthContext';

const GerenciarUsuarios = () => {
  const { user } = useAuth();
  
  console.log('📋 GerenciarUsuarios: renderizando', user);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-500 mt-1">Apenas administradores podem acessar esta página</p>
        </div>
      </div>
      
      <div className="bg-white/70 border-0 shadow-lg rounded-lg p-6">
        <p className="text-gray-700">
          Página em desenvolvimento. Em breve você poderá gerenciar todos os usuários do sistema.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Logado como: {user?.email} - {user?.isAdmin ? 'Admin' : 'Usuário'}
        </p>
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
