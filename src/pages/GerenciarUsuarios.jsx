import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, Trash2, Loader2, 
  MoreVertical, CheckCircle, User, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from '@/lib/AuthContext';

// Função para chamar a API de usuários
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://aroma-data-backend.onrender.com/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
};

const GerenciarUsuarios = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const data = await apiRequest('/usuarios');
      return Array.isArray(data) ? data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setSuccessMessage("Usuário cadastrado com sucesso!");
      setShowSuccessModal(true);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.error || "Erro ao cadastrar usuário");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await apiRequest(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setSuccessMessage("Usuário atualizado com sucesso!");
      setShowSuccessModal(true);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.error || "Erro ao atualizar usuário");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiRequest(`/usuarios/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success("Usuário excluído permanentemente!");
    },
    onError: (error) => {
      toast.error(error.error || "Erro ao excluir usuário");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({ email: "", name: "", password: "", confirmPassword: "" });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }
    
    const data = {
      email: formData.email,
      name: formData.name,
    };
    
    if (formData.password) {
      data.password = formData.password;
    }
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || "",
      name: user.name || "",
      password: "",
      confirmPassword: "",
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    if (id === currentUser?.id) {
      toast.error("Você não pode excluir seu próprio usuário");
      return;
    }
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-500 mt-1">{filteredUsers.length} usuários cadastrados</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/70 border-purple-100"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
            <Button 
              variant="link" 
              onClick={() => setShowForm(true)}
              className="text-purple-600 mt-2"
            >
              Cadastrar primeiro usuário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(user.id)}
                        className="text-red-600"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-xs text-gray-400">
                  ID: {user.id} • Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-emerald-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600">{successMessage}</p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600">
              ⚠️ Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">
              Tem certeza que deseja excluir permanentemente este usuário?
            </p>
            <p className="text-sm text-red-500">
              Esta ação não pode ser desfeita!
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
              </Label>
              <Input 
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input 
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!editingUser && !!formData.password}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingUser ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarUsuarios;
