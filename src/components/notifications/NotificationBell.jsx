import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell() {
  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes-estoque'],
    queryFn: () => base44.entities.NotificacaoEstoque.filter({ visualizada: false }),
    refetchInterval: 30000,
  });

  const count = notificacoes.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Notificações</h4>
            {count > 0 && (
              <Badge variant="destructive">{count} alertas</Badge>
            )}
          </div>
          
          {count === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma notificação pendente
            </p>
          ) : (
 
