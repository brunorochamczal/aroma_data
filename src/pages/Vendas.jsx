import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, Search, ShoppingCart, Loader2, 
  Eye, Calendar, MoreVertical, CheckCircle, Trash2
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
import { toast } from "sonner";
import NovaVendaForm from "@/components/vendas/NovaVendaForm";
import VendaDetalhe from "@/components/vendas/VendaDetalhe";

const Vendas = () => {
  const [search, setSearch] = useState("");
  const [showNovaVenda, setShowNovaVenda] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const queryClient = useQueryClient();

  // GARANTIR QUE VENDAS É SEMPRE UM ARRAY
  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const response = await aroma.vendas.listar();
      // Garantir que é array
      const vendasArray = Array.isArray(response) ? response : [];
      return vendasArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await aroma.vendas.excluir(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success("Venda excluída permanentemente!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir venda");
      console.error(error);
    },
  });

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

  // Função segura para formatar preço
  const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Garantir que filteredVendas é array
  const filteredVendas = Array.isArray(vendas) ? vendas.filter(v => 
    v?.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
    v?.id?.toString().includes(search)
  ) : [];

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
          placeholder="Buscar por cliente..."
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
        <div className="grid grid-cols-1 gap-4">
          {filteredVendas.map((venda) => (
            <Card 
              key={venda.id} 
              className="bg-white/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold">
                      {venda.cliente_nome?.[0] || "V"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{venda.cliente_nome || "Venda Avulsa"}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(venda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {venda.cancelada ? (
                      <Badge variant="destructive">Cancelada</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700">Concluída</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedVenda(venda)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(venda.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Total de Itens</p>
                    <p className="font-semibold">{venda.itens?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Valor Total</p>
                    <p className="font-semibold text-emerald-600">
                      R$ {formatPrice(venda.valor_final || venda.valor_total || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Desconto</p>
                    <p className="font-semibold text-red-500">
                      R$ {formatPrice(venda.desconto || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
              Tem certeza que deseja excluir permanentemente esta venda?
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

      {/* Nova Venda Dialog */}
      <Dialog open={showNovaVenda} onOpenChange={setShowNovaVenda}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          {showNovaVenda && (
            <NovaVendaForm 
              onSuccess={() => {
                setShowNovaVenda(false);
                setSuccessMessage("Venda realizada com sucesso!");
                setShowSuccessModal(true);
                queryClient.invalidateQueries({ queryKey: ['vendas'] });
                queryClient.invalidateQueries({ queryKey: ['produtos'] });
              }}
              onCancel={() => setShowNovaVenda(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detalhe da Venda */}
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedVenda && (
            <VendaDetalhe venda={selectedVenda} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendas;
