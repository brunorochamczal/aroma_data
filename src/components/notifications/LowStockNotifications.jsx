import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { aroma } from "@/api/aromaClient";

export default function LowStockNotifications() {
  const queryClient = useQueryClient();

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes-estoque'],
    queryFn: async () => {
      // Adapte para sua API real
      const response = await aroma.vendas.listar(); // Temporário
      return response.filter(n => !n.visualizada) || [];
    },
    refetchInterval: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (id) => {
      // Implementar quando tiver endpoint de notificações
      console.log('Dispensar notificação:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-estoque'] });
    },
  });

  const dismissAll = async () => {
    for (const notif of notificacoes) {
      await dismissMutation.mutateAsync(notif.id);
    }
  };

  if (notificacoes.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      <AnimatePresence>
        {notificacoes.slice(0, 3).map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">Estoque Baixo</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => dismissMutation.mutate(notif.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                {notif.mensagem || 'Produto com estoque baixo'}
              </p>
            </div>
          </motion.div>
        ))}
        {notificacoes.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={dismissAll}
            className="w-full bg-white/80 backdrop-blur-sm"
          >
            Dispensar todas ({notificacoes.length})
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
}
