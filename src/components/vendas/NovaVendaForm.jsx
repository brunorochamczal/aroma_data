import React, { useState, useEffect } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const NovaVendaForm = ({ onSuccess, onCancel }) => {
  const [clienteId, setClienteId] = useState("cliente_avulso");
  const [clienteNome, setClienteNome] = useState("");
  const [itens, setItens] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);

  // Buscar produtos
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-venda'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      const produtosArray = Array.isArray(response) ? response : [];
      return produtosArray.filter(p => p?.ativo !== false && (p?.estoque_atual || 0) > 0);
    },
  });

  // Buscar clientes
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-venda'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  // Efeito para filtrar produtos quando searchTerm ou produtos mudam
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProdutosFiltrados(produtos);
    } else {
      const filtered = produtos.filter(p => 
        p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProdutosFiltrados(filtered);
    }
  }, [searchTerm, produtos]);

  const criarVendaMutation = useMutation({
    mutationFn: async (dados) => {
      return await aroma.vendas.criar(dados);
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar venda");
      console.error(error);
    },
  });

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto");
      return;
    }

    if (!quantidade || quantidade < 1) {
      toast.error("Quantidade inválida");
      return;
    }

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    if ((produto.estoque_atual || 0) < quantidade) {
      toast.error(`Estoque insuficiente. Disponível: ${produto.estoque_atual || 0}`);
      return;
    }

    const precoUnitario = parseFloat(produto.preco_venda) || 0;
    const subtotal = precoUnitario * parseInt(quantidade);

    setItens([...itens, {
      produto_id: produto.id,
      produto_nome: produto.nome,
      quantidade: parseInt(quantidade),
      preco_unitario: precoUnitario,
      subtotal: subtotal
    }]);

    setProdutoSelecionado("");
    setQuantidade(1);
    setSearchTerm("");
  };

  const removerItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item à venda");
      return;
    }

    const valorTotal = itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    
    // Determinar nome do cliente
    let nomeCliente = "Venda Avulsa";
    if (clienteId && clienteId !== "cliente_avulso") {
      const clienteSelecionado = clientes.find(c => c.id === clienteId);
      nomeCliente = clienteSelecionado?.nome || "Venda Avulsa";
    } else if (clienteNome.trim()) {
      nomeCliente = clienteNome.trim();
    }

    const vendaData = {
      cliente_id: clienteId !== "cliente_avulso" ? clienteId : null,
      cliente_nome: nomeCliente,
      itens: itens.map(item => ({
        ...item,
        preco_unitario: parseFloat(item.preco_unitario) || 0,
        subtotal: parseFloat(item.subtotal) || 0
      })),
      valor_total: parseFloat(valorTotal) || 0,
      valor_final: parseFloat(valorTotal) || 0,
      created_at: new Date().toISOString(),
    };

    criarVendaMutation.mutate(vendaData);
  };

  if (loadingProdutos) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seleção de Cliente */}
      <div className="space-y-2">
        <Label htmlFor="cliente">Cliente</Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um cliente">
              {clienteId === "cliente_avulso" ? "Venda Avulsa" : 
               clientes.find(c => c.id === clienteId)?.nome || "Selecione um cliente"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente_avulso">Venda Avulsa</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Campo para cliente não cadastrado */}
        {clienteId === "cliente_avulso" && (
          <div className="mt-2">
            <Label htmlFor="cliente_nome">Nome do cliente (não cadastrado)</Label>
            <Input
              id="cliente_nome"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Digite o nome do cliente"
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Busca de Produtos */}
      <div className="space-y-2">
        <Label>Buscar Produtos</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Digite para buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && produtosFiltrados.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            Nenhum produto encontrado com "{searchTerm}"
          </p>
        )}
      </div>

      {/* Adicionar Itens */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Adicionar Itens</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label>Produto</Label>
              <Select
                value={produtoSelecionado}
                onValueChange={setProdutoSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtosFiltrados.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} - R$ {formatPrice(produto.preco_venda)} 
                      {produto.marca && ` (${produto.marca})`}
                      {produto.estoque_atual > 0 && ` - Estoque: ${produto.estoque_atual}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                disabled={!produtoSelecionado}
              />
            </div>
            <div className="col-span-1 flex items-end">
              <Button
                type="button"
                onClick={adicionarItem}
                disabled={!produtoSelecionado}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      {itens.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Itens da Venda</h3>
            <div className="space-y-2">
              {itens.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.produto_nome}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantidade} x R$ {formatPrice(item.preco_unitario)} = R$ {formatPrice(item.subtotal)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-emerald-600">
                  R$ {formatPrice(itens.reduce((acc, item) => acc + (item.subtotal || 0), 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
          disabled={itens.length === 0 || criarVendaMutation.isPending}
        >
          {criarVendaMutation.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Finalizar Venda
        </Button>
      </div>
    </form>
  );
};

export default NovaVendaForm;
