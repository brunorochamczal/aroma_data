import React from "react";
import { useAuth } from '@/lib/AuthContext';

const GerenciarUsuarios = () => {
  const { user } = useAuth();
  
  console.log('📋 GerenciarUsuarios: componente carregado', user);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
      <p className="text-gray-500">Página em desenvolvimento</p>
      <div className="bg-white p-4 rounded-lg shadow">
        <p>Usuário logado: {user?.email}</p>
        <p>Admin: {user?.isAdmin ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
