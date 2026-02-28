import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, Trash2, Package, 
  Loader2, MoreVertical, PackagePlus, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Produtos() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEstoqueForm, setShowEstoqueForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [estoqueQuantidade, setEstoqueQuantidade] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    marca: "",
    volume: "",
    preco_custo: "",
    preco_venda: "",
    estoque_atual: 0,
    estoque_minimo: 5,
    fornecedor_id: "",
  });

  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return response.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const response = await aroma.fornecedores.listar();
      return response.filter(f => f.ativo !== false);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await aroma.produtos.criar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Produto cadastrado com sucesso!");
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await aroma.produtos.atualizar(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Produto atualizado com sucesso!");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutation
