import React, { useState, useEffect } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Search, User } from "lucide-react";
import { toast } from "sonner";

const NovaVendaForm = ({ onSuccess, onCancel }) => {
  // Estados para cliente
  const [clienteSearchText, setClienteSearchText] = useState("");
  const [clientesVisiveis, setClientesVisiveis] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteNomeAvulso, setClienteNomeAvulso] = useState("");

  // Estados para produtos
  const [produtoSearchText, setProdutoSearchText] = useState("");
  const [produtosVisiveis, setProdutosVisiveis] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState([]);

  // Buscar produtos
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      console.log('📦 Produtos carregados:', response);
      return Array.isArray(response) ? response : [];
    },
  });

  // Buscar clientes
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();
      console.log('👥 Clientes carregados:', response);
      return Array.isArray(response) ? response : [];
    },
  });

  // Efeito para filtrar clientes
  useEffect(() => {
    if (!clienteSearchText.trim()) {
      setClientesVisiveis([]);
      return;
    }

    const filtrados = clientes.filter(c => 
      c.nome?.toLowerCase().includes(clienteSearchText.toLowerCase()) ||
      c.email?.toLowerCase().includes(clienteSearchText.toLowerCase()) ||
      c.cpf?.includes(clienteSearchText)
    );
    setClientesVisiveis(filtrados);
  }, [clienteSearchText, clientes]);

  // Efeito para filtrar produtos
  useEffect(() => {
    if (!produtoSearchText.trim()) {
      setProdutosVisiveis([]);
      return;
    }

    const filtrados = produtos.filter(p => 
      p.nome?.toLowerCase().includes(produtoSearchText.toLowerCase()) ||
      p.marca?.toLowerCase().includes(produtoSearchText.toLowerCase())
    );
    setProdutosVisiveis(filtrados);
  }, [produtoSearchText, produtos]);

  const criarVendaMutation = useMutation({
    mutationFn: async (dados) => {
      console.log('📤 Enviando venda:', dados);
      const response = await aroma.vendas.criar(dados);
      console.log('📥 Resposta da venda:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Venda criada com sucesso:', data);
      toast.success("Venda realizada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      console.error('❌ Erro ao criar venda:', error);
      toast.error(error.message || "Erro ao registrar venda");
    },
  });

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

    const precoUnitario = parseFloat(produtoSelecionado.preco_venda) || 0;
    
    const novoItem = {
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      quantidade: parseInt(quantidade),
      preco_unitario: precoUnitario,
      subtotal: precoUnitario * parseInt(quantidade)
    };

    console.log('➕ Item adicionado:', novoItem);
    setItens([...itens, novoItem]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setProdutoSearchText("");
  };

  const removerItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  };

  const selecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setClienteNomeAvulso("");
    setClienteSearchText("");
    setClientesVisiveis([]);
  };

  const limparCliente = () => {
    setClienteSelecionado(null);
    setClienteSearchText("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    let nomeCliente = "Venda Avulsa";
    let clienteId = null;

    if (clienteSelecionado) {
      nomeCliente = clienteSelecionado.nome;
      clienteId = clienteSelecionado.id;
    } else if (clienteNomeAvulso.trim()) {
      nomeCliente = clienteNomeAvulso.trim();
    }

    const valorTotal = calcularTotal();

    const vendaData = {
      cliente_id: clienteId,
      cliente_nome: nomeCliente,
      itens: itens.map(item => ({
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      })),
      valor_total: valorTotal,
      valor_final: valorTotal,
      desconto: 0,
      observacoes: ""
    };

    console.log('🚀 Enviando venda:', vendaData);
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
      {/* SEÇÃO CLIENTE */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-purple-600" />
          Cliente
        </Label>

        {!clienteSelecionado ? (
          <>
            <Input
              placeholder="Digite para buscar clientes..."
              value={clienteSearchText}
              onChange={(e) => setClienteSearchText(e.target.value)}
              autoComplete="off"
            />

            {clientesVisiveis.length > 0 && (
              <div className="border rounded-lg p-2 max-h-60 overflow-y-auto bg-white shadow-lg">
                {clientesVisiveis.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="p-3 cursor-pointer hover:bg-purple-50 rounded-lg border-b last:border-0 transition-colors"
                    onClick={() => selecionarCliente(cliente)}
                  >
                    <div className="font-medium">{cliente.nome}</div>
                    <div className="text-sm text-gray-500">
                      {cliente.email && <span>{cliente.email} • </span>}
                      {cliente.telefone && <span>{cliente.telefone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Opção de venda avulsa */}
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-700 mb-2">Venda Avulsa</p>
              <Input
                placeholder="Nome do cliente (opcional)"
                value={clienteNomeAvulso}
                onChange={(e) => setClienteNomeAvulso(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="p-4 bg-purple-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">{clienteSelecionado.nome}</p>
              <p className="text-sm text-gray-600">
                {clienteSelecionado.email && <span>{clienteSelecionado.email} • </span>}
                {clienteSelecionado.telefone}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limparCliente}
              className="text-purple-600 hover:text-purple-800"
            >
              Trocar cliente
            </Button>
          </div>
        )}
      </div>

      {/* SEÇÃO PRODUTOS */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-600" />
          Produtos
        </Label>

        <Input
          placeholder="Digite para buscar produtos..."
          value={produtoSearchText}
          onChange={(e) => setProdutoSearchText(e.target.value)}
          autoComplete="off"
        />

        {produtosVisiveis.length > 0 && (
          <div className="border rounded-lg p-2 max-h-60 overflow-y-auto bg-white shadow-lg">
            {produtosVisiveis.map((produto) => (
              <div
                key={produto.id}
                className={`p-3 cursor-pointer hover:bg-purple-50 rounded-lg border-b last:border-0 transition-colors ${
                  produtoSelecionado?.id === produto.id ? 'bg-purple-100' : ''
                }`}
                onClick={() => {
                  setProdutoSelecionado(produto);
                  setProdutoSearchText("");
                  setProdutosVisiveis([]);
                }}
              >
                <div className="font-medium">{produto.nome}</div>
                <div className="text-sm text-gray-500">
                  {produto.marca && <span>{produto.marca} • </span>}
                  <span>R$ {formatPrice(produto.preco_venda)}</span>
                  <span className="ml-2">Estoque: {produto.estoque_atual}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {produtoSelecionado && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{produtoSelecionado.nome}</p>
                <p className="text-sm text-gray-600">
                  Preço: R$ {formatPrice(produtoSelecionado.preco_venda)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setProdutoSelecionado(null)}
              >
                Trocar
              </Button>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  max={produtoSelecionado.estoque_atual}
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
          </div>
        )}
      </div>

      {/* LISTA DE ITENS */}
      {itens.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Itens da Venda</h3>
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
                  className="text-red-500 hover:text-red-700"
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

      {/* BOTÕES */}
      <div className="flex gap-3 pt-4">
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
