import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X, Package, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function LowStockNotifications() {
  const queryClient = useQueryClient();

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes-estoque'],
    queryFn: () => base44.entities.NotificacaoEstoque.filter({ visualizada: false }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificacaoEstoque.update(id, { visualizada: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-estoque'] });
    },
  });

  const dismissAll = async () => {
    for (const notif of notificacoes) {
      await base44.entities.NotificacaoEstoque.update(notif.id, { visualizada: true });
    }
    queryClient.invalidateQueries({ queryKey: ['notificacoes-estoque'] });
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
 
