import React, { useState, useEffect } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, Plus, Trash2, Search, User, Package, 
  ShoppingCart, X, Check, AlertCircle 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const NovaVendaForm = ({ onSuccess, onCancel }) => {
  // Estados
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteNomeAvulso, setClienteNomeAvulso] = useState("");
  const [itens, setItens] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [modoAvulso, setModoAvulso] = useState(false);

  // Buscar produtos
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-venda'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  // Buscar clientes
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes-venda'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  const criarVendaMutation = useMutation({
    mutationFn: async (dados) => {
      return await aroma.vendas.criar(dados);
    },
    onSuccess: () => {
      toast.success("✅ Venda realizada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar venda");
      console.error(error);
    },
  });

  // Filtrar produtos disponíveis (com estoque)
  const produtosDisponiveis = produtos.filter(p => 
    p?.ativo !== false && (p?.estoque_atual || 0) > 0
  );

  // Filtrar produtos pela busca
  const produtosFiltrados = produtosDisponiveis.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto");
      return;
    }

    if (quantidade < 1) {
      toast.error("Quantidade inválida");
      return;
    }

    if (produtoSelecionado.estoque_atual < quantidade) {
      toast.error(`Estoque insuficiente. Disponível: ${produtoSelecionado.estoque_atual}`);
      return;
    }

    // Verificar se o produto já está na lista
    const itemExistente = itens.find(item => item.produto_id === produtoSelecionado.id);
    
    if (itemExistente) {
      // Se já existe, pergunta se quer adicionar mais
      if (confirm(`Produto já adicionado. Deseja adicionar mais ${quantidade} unidades?`)) {
        const novosItens = itens.map(item => 
          item.produto_id === produtoSelecionado.id
            ? { 
                ...item, 
                quantidade: item.quantidade + quantidade,
                subtotal: (item.quantidade + quantidade) * item.preco_unitario
              }
            : item
        );
        setItens(novosItens);
      }
    } else {
      // Adicionar novo item
      const novoItem = {
        produto_id: produtoSelecionado.id,
        produto_nome: produtoSelecionado.nome,
        produto_marca: produtoSelecionado.marca,
        quantidade: quantidade,
        preco_unitario: parseFloat(produtoSelecionado.preco_venda) || 0,
        subtotal: (parseFloat(produtoSelecionado.preco_venda) || 0) * quantidade
      };
      setItens([...itens, novoItem]);
    }

    // Limpar seleção
    setProdutoSelecionado(null);
    setQuantidade(1);
    setSearchTerm("");
  };

  const removerItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item à venda");
      return;
    }

    if (!clienteSelecionado && !clienteNomeAvulso.trim() && !modoAvulso) {
      toast.error("Selecione um cliente ou informe o nome para venda avulsa");
      return;
    }

    const vendaData = {
      cliente_id: clienteSelecionado?.id || null,
      cliente_nome: clienteSelecionado?.nome || clienteNomeAvulso || "Venda Avulsa",
      itens: itens.map(item => ({
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      })),
      valor_total: calcularTotal(),
      valor_final: calcularTotal(),
      created_at: new Date().toISOString(),
    };

    criarVendaMutation.mutate(vendaData);
  };

  const selecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setClienteNomeAvulso("");
    setModoAvulso(false);
  };

  const ativarModoAvulso = () => {
    setClienteSelecionado(null);
    setModoAvulso(true);
  };

  if (loadingProdutos || loadingClientes) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SEÇÃO: Cliente */}
      <Card className="border-2 border-purple-100">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Cliente</h2>
          </div>

          <div className="space-y-4">
            {/* Lista de clientes em grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                type="button"
                variant={modoAvulso ? "default" : "outline"}
                className={`justify-start ${modoAvulso ? 'bg-purple-600 text-white' : ''}`}
                onClick={ativarModoAvulso}
              >
                <User className="h-4 w-4 mr-2" />
                Venda Avulsa
              </Button>
              
              {clientes.slice(0, 5).map((cliente) => (
                <Button
                  key={cliente.id}
                  type="button"
                  variant={clienteSelecionado?.id === cliente.id ? "default" : "outline"}
                  className={`justify-start ${clienteSelecionado?.id === cliente.id ? 'bg-purple-600 text-white' : ''}`}
                  onClick={() => selecionarCliente(cliente)}
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="truncate">{cliente.nome}</span>
                </Button>
              ))}
            </div>

            {/* Campo para nome avulso */}
            {modoAvulso && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <Label htmlFor="cliente_nome">Nome do cliente</Label>
                <Input
                  id="cliente_nome"
                  value={clienteNomeAvulso}
                  onChange={(e) => setClienteNomeAvulso(e.target.value)}
                  placeholder="Digite o nome do cliente"
                  className="mt-1 bg-white"
                  autoFocus
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO: Produtos */}
      <Card className="border-2 border-purple-100">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Produtos</h2>
          </div>

          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos por nome ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grid de produtos */}
          {searchTerm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
              {produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((produto) => (
                  <Button
                    key={produto.id}
                    type="button"
                    variant="outline"
                    className={`justify-start h-auto p-3 ${
                      produtoSelecionado?.id === produto.id ? 'border-2 border-purple-600 bg-purple-50' : ''
                    }`}
                    onClick={() => setProdutoSelecionado(produto)}
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-gray-500">
                        {produto.marca} • R$ {formatPrice(produto.preco_venda)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        Estoque: {produto.estoque_atual}
                      </Badge>
                    </div>
                    {produtoSelecionado?.id === produto.id && (
                      <Check className="h-4 w-4 text-purple-600 ml-2" />
                    )}
                  </Button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4 col-span-2">
                  Nenhum produto encontrado
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4 border rounded-lg">
              Digite para buscar produtos
            </p>
          )}

          {/* Controles de quantidade */}
          {produtoSelecionado && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{produtoSelecionado.nome}</p>
                  <p className="text-sm text-gray-600">
                    R$ {formatPrice(produtoSelecionado.preco_venda)} por unidade
                  </p>
                </div>
                <Badge>Estoque: {produtoSelecionado.estoque_atual}</Badge>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    max={produtoSelecionado.estoque_atual}
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  onClick={adicionarItem}
                  className="mt-6 bg-gradient-to-r from-purple-600 to-violet-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO: Itens da Venda */}
      {itens.length > 0 && (
        <Card className="border-2 border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Itens da Venda</h2>
              <Badge className="ml-auto">{itens.length} itens</Badge>
            </div>

            <div className="space-y-2">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.produto_nome}</p>
                      {item.produto_marca && (
                        <Badge variant="outline" className="text-xs">
                          {item.produto_marca}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.quantidade} x R$ {formatPrice(item.preco_unitario)} ={' '}
                      <span className="font-semibold text-emerald-600">
                        R$ {formatPrice(item.subtotal)}
                      </span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerItem(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-emerald-600">
                R$ {formatPrice(calcularTotal())}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          disabled={itens.length === 0 || criarVendaMutation.isPending}
        >
          {criarVendaMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Finalizar Venda
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default NovaVendaForm;
