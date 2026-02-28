import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, Search, ShoppingCart, Loader2, 
  Eye, Calendar, MoreVertical
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import NovaVendaForm from "@/components/vendas/NovaVendaForm";
import VendaDetalhe from "@/components/vendas/VendaDetalhe";

export default function Vendas() {
  const [search, setSearch] = useState("");
  const [showNovaVenda, setShowNovaVenda] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);

  const queryClient = useQueryClient();

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const response = await aroma.vendas.listar();
      return response.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: async (venda) => {
      // Restaurar estoque
      if (venda.itens && !venda.cancelada) {
        for (const item of venda.itens) {
          const produtos = await aroma.produtos.listar();
          const produto = produtos.find(p => p.id === item.produto_id);
          if (produto) {
            await aroma.produtos.atualizar(produto.id, {
              estoque_atual: (produto.estoque_atual || 0) + item.quantidade
            });
            await aroma.movimentacoes.criar({
              produto_id: produto.id,
              produto_nome: produto.nome,
              tipo: "ENTRADA",
              quantidade: item.quantidade,
              motivo: "CANCELAMENTO",
              referencia_id: venda.id,
            });
          }
        }
      }
      await aroma.vendas.cancelar(venda.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success("Venda cancelada com sucesso!");
      setSelectedVenda(null);
    },
    onError: (error) => {
      toast.error("Erro ao cancelar venda");
      console.error(error);
    },
  });

  const filteredVendas = vendas.filter(v => 
    v.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
    v.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-500 mt-1">{filteredVendas.length} vendas registradas</p>
        </div>
        <Button 
          onClick={() => setShowNovaVenda(true)}
          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Buscar por cliente ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/70 border-purple-100"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : filteredVendas.length === 0 ? (
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma venda encontrada</p>
            <Button 
              variant="link" 
              onClick={() => setShowNovaVenda(true)}
              className="text-purple-600 mt-2"
            >
              Registrar primeira venda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/70 border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.map((venda) => (
                  <TableRow 
                    key={venda.id} 
                    className="cursor-pointer hover:bg-purple-50/50"
                    onClick={() => setSelectedVenda(venda)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(venda.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                          {venda.cliente_nome?.[0] || "A"}
                        </div>
                        <span className="font-medium">{venda.cliente_nome || "Venda Avulsa"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {venda.itens?.length || 0} {venda.itens?.length === 1 ? 'item' : 'itens'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">
                        R$ {(venda.valor_final || venda.valor_total || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {venda.cancelada ? (
                        <Badge variant="destructive">Cancelada</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Concluída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedVenda(venda)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {!venda.cancelada && (
                            <DropdownMenuItem 
                              onClick={() => cancelarMutation.mutate(venda)}
                              className="text-red-600"
                            >
                              Cancelar venda
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Nova Venda Dialog */}
      <Dialog open={showNovaVenda} onOpenChange={setShowNovaVenda}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <NovaVendaForm 
            onSuccess={() => {
              setShowNovaVenda(false);
              queryClient.invalidateQueries({ queryKey: ['vendas'] });
              queryClient.invalidateQueries({ queryKey: ['produtos'] });
            }}
            onCancel={() => setShowNovaVenda(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Detalhe da Venda */}
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedVenda && (
            <VendaDetalhe 
              venda={selectedVenda}
              onCancelar={() => cancelarMutation.mutate(selectedVenda)}
              isCancelling={cancelarMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
