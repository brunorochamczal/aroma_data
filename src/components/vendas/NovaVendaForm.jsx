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
  // Estados simples
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [itens, setItens] = useState([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [produtosVisiveis, setProdutosVisiveis] = useState([]);

  // Buscar produtos
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  // Buscar clientes
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  // Efeito para filtrar produtos
  useEffect(() => {
    if (!searchText.trim()) {
      setProdutosVisiveis([]);
      return;
    }

    const filtrados = produtos.filter(p => 
      p.nome?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.marca?.toLowerCase().includes(searchText.toLowerCase())
    );
    setProdutosVisiveis(filtrados);
  }, [searchText, produtos]);

  const criarVendaMutation = useMutation({
    mutationFn: async (dados) => {
      return await aroma.vendas.criar(dados);
    },
    onSuccess: () => {
      toast.success("Venda realizada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar venda");
    },
  });

  const formatPrice = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const adicionarItem = () => {
    if (!produtoId) {
      toast.error("Selecione um produto");
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    if (quantidade < 1) {
      toast.error("Quantidade inválida");
      return;
    }

    if (produto.estoque_atual < quantidade) {
      toast.error(`Estoque insuficiente. Disponível: ${produto.estoque_atual}`);
      return;
    }

    const novoItem = {
      produto_id: produto.id,
      produto_nome: produto.nome,
      quantidade: quantidade,
      preco_unitario: parseFloat(produto.preco_venda) || 0,
      subtotal: (parseFloat(produto.preco_venda) || 0) * quantidade
    };

    setItens([...itens, novoItem]);
    setProdutoId("");
    setQuantidade(1);
    setSearchText("");
  };

  const removerItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + item.subtotal, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    let nomeCliente = "Venda Avulsa";
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId);
      nomeCliente = cliente?.nome || "Venda Avulsa";
    } else if (clienteNome.trim()) {
      nomeCliente = clienteNome.trim();
    }

    const vendaData = {
      cliente_id: clienteId || null,
      cliente_nome: nomeCliente,
      itens: itens,
      valor_total: calcularTotal(),
      valor_final: calcularTotal(),
    };

    criarVendaMutation.mutate(vendaData);
  };

  if (loadingProdutos || loadingClientes) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Cliente</Label>
        
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Venda Avulsa</SelectItem>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!clienteId && (
          <Input
            placeholder="Nome do cliente (para venda avulsa)"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
        )}
      </div>

      {/* Busca de Produtos */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Produtos</Label>
        
        <Input
          placeholder="Digite para buscar produtos..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {produtosVisiveis.length > 0 && (
          <div className="border rounded-lg p-2 max-h-60 overflow-y-auto">
            {produtosVisiveis.map((produto) => (
              <div
                key={produto.id}
                className={`p-2 cursor-pointer hover:bg-purple-50 rounded ${
                  produtoId === produto.id ? 'bg-purple-100 border border-purple-300' : ''
                }`}
                onClick={() => {
                  setProdutoId(produto.id);
                  setSearchText("");
                  setProdutosVisiveis([]);
                }}
              >
                <div className="font-medium">{produto.nome}</div>
                <div className="text-sm text-gray-500">
                  {produto.marca} - R$ {formatPrice(produto.preco_venda)}
                  {' '}(Estoque: {produto.estoque_atual})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quantidade e Adicionar */}
      {produtoId && (
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
            />
          </div>
          <Button
            type="button"
            onClick={adicionarItem}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      )}

      {/* Lista de Itens */}
      {itens.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Itens da Venda</h3>
          {itens.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <div className="font-medium">{item.produto_nome}</div>
                <div className="text-sm text-gray-500">
                  {item.quantidade} x R$ {formatPrice(item.preco_unitario)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  R$ {formatPrice(item.subtotal)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerItem(index)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t">
            <span>Total:</span>
            <span className="text-emerald-600">
              R$ {formatPrice(calcularTotal())}
            </span>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          disabled={itens.length === 0 || criarVendaMutation.isPending}
        >
          {criarVendaMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Finalizar Venda"
          )}
        </Button>
      </div>
    </form>
  );
};

export default NovaVendaForm;
