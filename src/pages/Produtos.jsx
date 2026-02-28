import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
    queryFn: () => base44.entities.Produto.list('-created_date'),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.filter({ ativo: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Produto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Produto cadastrado com sucesso!");
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Produto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Produto atualizado com sucesso!");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Produto.update(id, { ativo: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Produto desativado com sucesso!");
    },
  });

  const addEstoqueMutation = useMutation({
    mutationFn: async ({ produto, quantidade }) => {
      const novoEstoque = (produto.estoque_atual || 0) + quantidade;
      await base44.entities.Produto.update(produto.id, { estoque_atual: novoEstoque });
      await base44.entities.MovimentacaoEstoque.create({
        produto_id: produto.id,
        produto_nome: produto.nome,
        tipo: "ENTRADA",
        quantidade,
        motivo: "COMPRA",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Estoque atualizado com sucesso!");
      setShowEstoqueForm(false);
      setSelectedProduto(null);
      setEstoqueQuantidade("");
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
      ativo: true,
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

  const handleAddEstoque = (produto) => {
    setSelectedProduto(produto);
    setShowEstoqueForm(true);
  };

  const filteredProdutos = produtos.filter(p => 
    p.ativo !== false && 
    (p.nome?.toLowerCase().includes(search.toLowerCase()) ||
     p.marca?.toLowerCase().includes(search.toLowerCase()))
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProdutos.map((produto) => {
            const isLowStock = (produto.estoque_atual || 0) <= (produto.estoque_minimo || 5);
            return (
              <Card 
                key={produto.id} 
                className={`bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${isLowStock ? 'ring-2 ring-amber-400' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                      <Package className="h-7 w-7 text-purple-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAddEstoque(produto)}>
                          <PackagePlus className="h-4 w-4 mr-2" />
                          Entrada de Estoque
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(produto)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(produto.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{produto.nome}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {produto.marca} {produto.volume && `• ${produto.volume}`}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Preço de venda</p>
                      <p className="text-lg font-bold text-emerald-600">
                        R$ {produto.preco_venda?.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Custo</p>
                      <p className="text-sm text-gray-600">
                        R$ {produto.preco_custo?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`${isLowStock ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-emerald-500 text-emerald-600 bg-emerald-50'}`}
                    >
                      {isLowStock && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {produto.estoque_atual || 0} em estoque
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* Estoque Dialog */}
      <Dialog open={showEstoqueForm} onOpenChange={setShowEstoqueForm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Entrada de Estoque</DialogTitle>
          </DialogHeader>
          {selectedProduto && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="font-semibold text-gray-900">{selectedProduto.nome}</p>
                <p className="text-sm text-gray-500">Estoque atual: {selectedProduto.estoque_atual || 0} unidades</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade a adicionar</Label>
                <Input 
                  id="quantidade"
                  type="number"
                  min="1"
                  value={estoqueQuantidade}
                  onChange={(e) => setEstoqueQuantidade(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEstoqueForm(false)} 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => addEstoqueMutation.mutate({ 
                    produto: selectedProduto, 
                    quantidade: parseInt(estoqueQuantidade) || 0 
                  })}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
                  disabled={!estoqueQuantidade || addEstoqueMutation.isPending}
                >
                  {addEstoqueMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
