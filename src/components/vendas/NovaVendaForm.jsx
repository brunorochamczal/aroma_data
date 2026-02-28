import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";  // ← IMPORT CORRIGIDO
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function NovaVendaForm({ onSuccess, onCancel }) {
  const [clienteId, setClienteId] = useState("");
  const [itens, setItens] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  // Buscar produtos disponíveis
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-venda'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();  // ← USO CORRIGIDO
      return response.filter(p => p.ativo !== false && (p.estoque_atual || 0) > 0);
    },
  });

  // Buscar clientes
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-venda'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();  // ← USO CORRIGIDO
      return response.filter(c => c.ativo !== false);
    },
  });

  const criarVendaMutation = useMutation({
    mutationFn: async (dados) => {
      return await aroma.vendas.criar(dados);  // ← USO CORRIGIDO
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao registrar venda");
      console.error(error);
    },
  });

  const adicionarItem = () => {
    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    setItens([...itens, {
      produto_id: produto.id,
      produto_nome: produto.nome,
      quantidade: parseInt(quantidade),
      preco_unitario: produto.preco_venda,
      subtotal: produto.preco_venda * parseInt(quantidade)
    }]);

    setProdutoSelecionado("");
    setQuantidade(1);
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

    const valorTotal = itens.reduce((acc, item) => acc + item.subtotal, 0);

    criarVendaMutation.mutate({
      cliente_id: clienteId || null,
      cliente_nome: clientes.find(c => c.id === clienteId)?.nome || "Venda Avulsa",
      itens,
      valor_total: valorTotal,
      valor_final: valorTotal,
      created_date: new Date().toISOString(),
    });
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
        <select
          id="cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Venda Avulsa</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Adicionar Itens */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Adicionar Itens</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label>Produto</Label>
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione...</option>
                {produtos.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} - R$ {produto.preco_venda?.toFixed(2)} (Estoque: {produto.estoque_atual})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                disabled={!produtoSelecionado}
              />
            </div>
            <div className="col-span-1 flex items-end">
              <Button
                type="button"
                onClick={adicionarItem}
                disabled={!produtoSelecionado}
                className="w-full"
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
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.produto_nome}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantidade} x R$ {item.preco_unitario.toFixed(2)} = R$ {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>R$ {itens.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}</span>
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
}
