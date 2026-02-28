import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, Minus, Trash2, Search, User, Package, 
  Loader2, ShoppingBag, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { checkAndNotifyLowStock } from "@/components/notifications/checkLowStock";

export default function NovaVendaForm({ onSuccess, onCancel }) {
  const [clienteId, setClienteId] = useState("");
  const [produtoSearch, setProdutoSearch] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [desconto, setDesconto] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-ativos'],
    queryFn: () => base44.entities.Cliente.filter({ ativo: true }),
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-ativos'],
    queryFn: () => base44.entities.Produto.filter({ ativo: true }),
  });

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      if (carrinho.length === 0) {
        throw new Error("Adicione pelo menos um produto ao carrinho");
      }

      // Verificar estoque
      for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.produto_id);
        if (!produto || (produto.estoque_atual || 0) < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${item.produto_nome}`);
        }
      }

      const cliente = clientes.find(c => c.id === clienteId);
      const valorTotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
      const descontoValue = parseFloat(desconto) || 0;
      const valorFinal = valorTotal - descontoValue;

      // Criar venda
      const venda = await base44.entities.Venda.create({
        cliente_id: clienteId || null,
        cliente_nome: cliente?.nome || "Venda Avulsa",
        itens: carrinho,
        valor_total: valorTotal,
        desconto: descontoValue,
        valor_final: valorFinal,
        observacoes,
        cancelada: false,
      });

      // Atualizar estoque e criar movimentações
      for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.produto_id);
        if (produto) {
          const novoEstoque = (produto.estoque_atual || 0) - item.quantidade;
          await base44.entities.Produto.update(produto.id, {
            estoque_atual: novoEstoque
          });
          await base44.entities.MovimentacaoEstoque.create({
            produto_id: produto.id,
            produto_nome: produto.nome,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            motivo: "VENDA",
            referencia_id: venda.id,
          });
          
          // Check and notify low stock
          const produtoAtualizado = { ...produto, estoque_atual: novoEstoque };
          const user = await base44.auth.me();
          await checkAndNotifyLowStock(produtoAtualizado, user?.email);
        }
      }

      return venda;
    },
    onSuccess: () => {
      toast.success("Venda finalizada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao finalizar venda");
    }
  });

  const addToCart = (produto) => {
    const existingIndex = carrinho.findIndex(item => item.produto_id === produto.id);
    
    if (existingIndex >= 0) {
      const newCarrinho = [...carrinho];
      const newQuantidade = newCarrinho[existingIndex].quantidade + 1;
      
      if (newQuantidade > (produto.estoque_atual || 0)) {
        toast.error("Estoque insuficiente!");
        return;
      }
      
      newCarrinho[existingIndex] = {
        ...newCarrinho[existingIndex],
        quantidade: newQuantidade,
        subtotal: newQuantidade * produto.preco_venda,
      };
      setCarrinho(newCarrinho);
    } else {
      if ((produto.estoque_atual || 0) < 1) {
        toast.error("Estoque insuficiente!");
        return;
      }
      
      setCarrinho([...carrinho, {
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        subtotal: produto.preco_venda,
      }]);
    }
    setProdutoSearch("");
  };

  const updateQuantidade = (index, delta) => {
    const newCarrinho = [...carrinho];
    const item = newCarrinho[index];
    const produto = produtos.find(p => p.id === item.produto_id);
    const newQuantidade = item.quantidade + delta;
    
    if (newQuantidade < 1) {
      removeFromCart(index);
      return;
    }
    
    if (newQuantidade > (produto?.estoque_atual || 0)) {
      toast.error("Estoque insuficiente!");
      return;
    }
    
    newCarrinho[index] = {
      ...item,
      quantidade: newQuantidade,
      subtotal: newQuantidade * item.preco_unitario,
    };
    setCarrinho(newCarrinho);
  };

  const removeFromCart = (index) => {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  };

  const filteredProdutos = produtos.filter(p => 
    p.nome?.toLowerCase().includes(produtoSearch.toLowerCase()) ||
    p.marca?.toLowerCase().includes(produtoSearch.toLowerCase())
  );

  const valorTotal = carrinho.reduce((acc, item) => acc + item.subtotal, 0);
  const descontoValue = parseFloat(desconto) || 0;
  const valorFinal = valorTotal - descontoValue;

  return (
    <div className="space-y-6">
      {/* Cliente */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Cliente
        </Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Venda Avulsa</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Busca de Produtos */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Adicionar Produtos
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar produto..."
            value={produtoSearch}
            onChange={(e) => setProdutoSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {produtoSearch && (
          <Card className="max-h-48 overflow-y-auto">
            <CardContent className="p-2">
              {filteredProdutos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">Nenhum produto encontrado</p>
              ) : (
                filteredProdutos.slice(0, 5).map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => addToCart(produto)}
                    className="w-full flex items-center justify-between p-3 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-sm text-gray-500">{produto.marca} • {produto.estoque_atual || 0} em estoque</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">R$ {produto.preco_venda?.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Carrinho */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Carrinho ({carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'})
        </Label>
        
        {carrinho.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-8 text-gray-500">
              <ShoppingBag className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">Carrinho vazio</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              {carrinho.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.produto_nome}</p>
                    <p className="text-sm text-gray-500">
                      R$ {item.preco_unitario.toFixed(2)} cada
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantidade(index, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantidade}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantidade(index, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="w-24 text-right">
                      <p className="font-semibold text-emerald-600">
                        R$ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeFromCart(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desconto */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Desconto (R$)
        </Label>
        <Input 
          type="number"
          step="0.01"
          min="0"
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
          placeholder="0,00"
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea 
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações da venda..."
          rows={2}
        />
      </div>

      {/* Totais */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {valorTotal.toFixed(2)}</span>
            </div>
            {descontoValue > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto</span>
                <span>- R$ {descontoValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-purple-200">
              <span>Total</span>
              <span className="text-emerald-600">R$ {valorFinal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button 
          onClick={() => finalizarMutation.mutate()}
          className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
          disabled={carrinho.length === 0 || finalizarMutation.isPending}
        >
          {finalizarMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}
