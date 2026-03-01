import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, 
  Loader2, Building2, MoreVertical, CheckCircle, Package, AlertTriangle
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
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Produtos() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
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
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return response.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const response = await aroma.fornecedores.listar();
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await aroma.produtos.criar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setSuccessMessage("Produto cadastrado com sucesso!");
      setShowSuccessModal(true);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar produto");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await aroma.produtos.atualizar(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setSuccessMessage("Produto atualizado com sucesso!");
      setShowSuccessModal(true);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar produto");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await aroma.produtos.excluir(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Produto excluído permanentemente!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir produto");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      marca: "",
      volume: "",
      preco_custo: "",
      preco_venda: "",
      estoque_atual: 0,
      estoque_minimo: 5,
      fornecedor_id: "",
    });
    setEditingProduto(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      preco_custo: parseFloat(formData.preco_custo) || 0,
      preco_venda: parseFloat(formData.preco_venda) || 0,
      estoque_atual: parseInt(formData.estoque_atual) || 0,
      estoque_minimo: parseInt(formData.estoque_minimo) || 5,
    };
    
    if (data.preco_venda <= data.preco_custo) {
      toast.error("O preço de venda deve ser maior que o preço de custo!");
      return;
    }

    if (editingProduto) {
      updateMutation.mutate({ id: editingProduto.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome || "",
      marca: produto.marca || "",
      volume: produto.volume || "",
      preco_custo: produto.preco_custo?.toString() || "",
      preco_venda: produto.preco_venda?.toString() || "",
      estoque_atual: produto.estoque_atual || 0,
      estoque_minimo: produto.estoque_minimo || 5,
      fornecedor_id: produto.fornecedor_id || "",
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
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

  const filteredProdutos = produtos.filter(p => 
    p.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.marca?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">{filteredProdutos.length} produtos cadastrados</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Buscar por nome ou marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/70 border-purple-100"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : filteredProdutos.length === 0 ? (
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
            <Button 
              variant="link" 
              onClick={() => setShowForm(true)}
              className="text-purple-600 mt-2"
            >
              Cadastrar primeiro produto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProdutos.map((produto) => {
            const isLowStock = (produto.estoque_atual || 0) <= (produto.estoque_minimo || 5);
            return (
              <Card 
                key={produto.id} 
                className={`bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${isLowStock ? 'ring-2 ring-amber-400' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{produto.nome}</h3>
                        <p className="text-sm text-gray-500">{produto.marca}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(produto)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(produto.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Preço:</span>
                      <span className="text-emerald-600 font-bold">
                        R$ {produto.preco_venda?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Estoque:</span>
                      <span className={isLowStock ? 'text-amber-600 font-bold' : 'text-gray-600'}>
                        {produto.estoque_atual || 0} un
                        {isLowStock && <AlertTriangle className="h-3 w-3 ml-1 inline" />}
                      </span>
                    </div>
                    {produto.volume && (
                      <div className="text-sm text-gray-500">
                        Volume: {produto.volume}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              Tem certeza que deseja excluir permanentemente?
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
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input 
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input 
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <Input 
                  id="volume"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  placeholder="Ex: 100ml"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_custo">Preço de Custo *</Label>
                <Input 
                  id="preco_custo"
                  type="number"
                  step="0.01"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_venda">Preço de Venda *</Label>
                <Input 
                  id="preco_venda"
                  type="number"
                  step="0.01"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque_atual">Estoque Atual</Label>
                <Input 
                  id="estoque_atual"
                  type="number"
                  value={formData.estoque_atual}
                  onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input 
                  id="estoque_minimo"
                  type="number"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select 
                  value={formData.fornecedor_id} 
                  onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                {editingProduto ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
