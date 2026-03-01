import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, Trash2, Loader2, 
  MoreVertical, CheckCircle, User, Mail, Key
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

// Função para chamar a API de usuários (usando o token do localStorage)
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
    
    if (formData.password !== formData.confirmPassword) {
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

  return (
    <div className="space-y-6">
      {/* ... resto do JSX continua igual ... */}
    </div>
  );
};

export default GerenciarUsuarios;
