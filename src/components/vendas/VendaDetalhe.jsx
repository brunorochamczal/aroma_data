import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, User, Package, Receipt, XCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VendaDetalhe({ venda, onCancelar, isCancelling }) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {format(new Date(venda.created_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        {venda.cancelada ? (
          <Badge variant="destructive">Cancelada</Badge>
        ) : (
          <Badge className="bg-emerald-100 text-emerald-700">Concluída</Badge>
        )}
      </div>

      {/* Cliente */}
      <Card className="bg-gray-50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold">
            {venda.cliente_nome?.[0] || "A"}
          </div>
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-semibold">{venda.cliente_nome || "Venda Avulsa"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Itens */}
      <div className="space-y-2">
        <p className="font-semibold text-gray-700 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Itens da Venda
        </p>
        <Card>
          <CardContent className="p-0 divide-y">
            {venda.itens?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{item.produto_nome}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantidade}x R$ {item.preco_unitario?.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">R$ {item.subtotal?.toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Totais */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>R$ {venda.valor_total?.toFixed(2)}</span>
          </div>
          {venda.desconto > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Desconto</span>
              <span>- R$ {venda.desconto?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-purple-200">
            <span>Total</span>
            <span className="text-emerald-600">
              R$ {(venda.valor_final || venda.valor_total)?.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {venda.observacoes && (
        <div className="space-y-2">
          <p className="font-semibold text-gray-700">Observações</p>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {venda.observacoes}
          </p>
        </div>
      )}

      {/* Ação de Cancelar */}
      {!venda.cancelada && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Venda
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Venda?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá cancelar a venda e restaurar o estoque dos produtos. 
                Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não, manter</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onCancelar}
                className="bg-red-600 hover:bg-red-700"
                disabled={isCancelling}
              >
                {isCancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sim, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
